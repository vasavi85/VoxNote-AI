import os
import json
import logging
import asyncio
from typing import Optional, List
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException,
    Response,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status,
)
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.database.session import get_db
from app.schemas.transcript import (
    HealthResponse,
    LanguagesResponse,
    TranscriptResponse,
    TranscriptDetailResponse,
    TranscriptListResponse,
    SummarizeRequest,
    NoteResponse,
)
from app.services.gnani_service import gnani_service
from app.services.audio_service import AudioService
from app.services.transcript_service import TranscriptService
from app.services.summary_service import summary_service
from app.services.pdf_service import pdf_service
from gnani.stt.exceptions import GnaniSTTError, AuthenticationError, InvalidAudioError
from gnani.stt.client import StreamTranscriptEvent, StreamErrorEvent

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    """Check backend, database, Gnani STT, and summarizer service status."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return {
        "status": "healthy",
        "version": settings.VERSION,
        "gnani": {
            "configured": gnani_service.is_configured,
            "model": gnani_service.model,
            "default_language": settings.GNANI_DEFAULT_LANGUAGE,
            "default_format": settings.GNANI_DEFAULT_FORMAT,
        },
        "summary_provider": summary_service.get_provider_status(),
        "database": {"type": "sqlite", "status": db_status},
    }


@router.get("/languages", response_model=LanguagesResponse)
def get_languages():
    """Return all 10 supported Indian languages and Prisma v3.0 output modes."""
    languages = gnani_service.get_supported_languages()
    return {
        "languages": languages,
        "auto_detect_code": "indic-auto",
        "output_modes": gnani_service.get_output_modes(),
        "streaming_supported": [l["code"] for l in languages],
    }


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Return aggregated metrics for the dashboard."""
    return TranscriptService.get_dashboard_stats(db)


@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language_code: str = Form(default="indic-auto"),
    output_mode: str = Form(default="transcribe"),
    keywords: Optional[str] = Form(default=None),
    topic: Optional[str] = Form(default=None),
    speaker_names: Optional[str] = Form(default=None),
    language_candidates: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
):
    """
    Accept an uploaded audio file and transcribe using Gnani Prisma v3.0.
    Stores the result in the SQLite database and returns the transcript record.
    """
    content = await file.read()
    file_size = len(content)

    # 1. Audio validation
    is_valid, err_msg = AudioService.validate_audio(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # 2. Check Gnani configuration
    if not gnani_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gnani AI is not configured. Please set a valid GNANI_API_KEY in backend/.env to transcribe audio.",
        )

    # Parse comma-separated or JSON list inputs
    parsed_keywords = [k.strip() for k in keywords.split(",")] if keywords and "," in keywords else ([keywords] if keywords else None)
    parsed_speakers = [s.strip() for s in speaker_names.split(",")] if speaker_names and "," in speaker_names else ([speaker_names] if speaker_names else None)
    parsed_candidates = [c.strip() for c in language_candidates.split(",")] if language_candidates and "," in language_candidates else ([language_candidates] if language_candidates else None)

    # 3. Transcribe using Gnani Service
    try:
        result = gnani_service.transcribe_file(
            audio_bytes=content,
            filename=file.filename,
            language_code=language_code,
            output_mode=output_mode,
            keywords=parsed_keywords,
            topic=topic,
            speaker_names=parsed_speakers,
            language_candidates=parsed_candidates,
        )
    except AuthenticationError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Gnani Authentication Error: {str(e)}")
    except InvalidAudioError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Gnani Audio Error: {str(e)}")
    except GnaniSTTError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Gnani STT Failure: {str(e)}")
    except Exception as e:
        logger.exception("Failed to transcribe audio")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Transcription failed: {str(e)}")

    # 4. Save to database
    record = TranscriptService.create_transcript(
        db=db,
        filename=file.filename,
        transcript_text=result.get("transcript", ""),
        language=language_code,
        detected_language=result.get("detected_language"),
        output_mode=output_mode,
        duration=result.get("duration", 0.0),
        model=result.get("model", "prisma-v3.0"),
        status="completed",
    )

    return record


@router.post("/transcribe/batch")
async def create_batch_transcription(
    file: UploadFile = File(...),
    language_code: str = Form(default="indic-auto"),
    output_mode: str = Form(default="transcribe"),
    keywords: Optional[str] = Form(default=None),
    topic: Optional[str] = Form(default=None),
    speaker_names: Optional[str] = Form(default=None),
):
    """Submit an audio file for asynchronous batch processing via Gnani Batch API."""
    content = await file.read()
    is_valid, err_msg = AudioService.validate_audio(file.filename, len(content))
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    if not gnani_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gnani AI is not configured. Please set GNANI_API_KEY in backend/.env.",
        )

    parsed_keywords = [k.strip() for k in keywords.split(",")] if keywords and "," in keywords else None
    parsed_speakers = [s.strip() for s in speaker_names.split(",")] if speaker_names and "," in speaker_names else None

    try:
        job_info = gnani_service.create_batch_job(
            audio_bytes=content,
            filename=file.filename,
            language_code=language_code,
            output_mode=output_mode,
            keywords=parsed_keywords,
            topic=topic,
            speaker_names=parsed_speakers,
        )
        return job_info
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Batch job creation failed: {str(e)}")


@router.get("/transcribe/batch/{job_id}")
def get_batch_transcription(job_id: str):
    """Check the status of a Gnani Batch STT job."""
    if not gnani_service.is_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Gnani AI not configured.")
    try:
        return gnani_service.get_batch_job_status(job_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Batch job not found or failed: {str(e)}")


@router.post("/transcribe/live")
def live_transcription_info():
    """Information endpoint for initiating WebSocket live transcription."""
    return {
        "status": "ready" if gnani_service.is_configured else "unconfigured",
        "protocol": "WebSocket",
        "websocket_endpoint": "/api/transcribe/live/ws",
        "expected_format": "Raw PCM 16-bit Mono 16000Hz (chunk size 1024 bytes)",
        "model": "prisma-v3.0",
        "sample_rate": 16000,
    }


@router.websocket("/transcribe/live/ws")
async def websocket_live_transcription(
    websocket: WebSocket,
    language_code: str = Query(default="indic-auto"),
    output_mode: str = Query(default="transcribe"),
):
    """
    WebSocket endpoint for real-time live microphone transcription.
    Accepts raw PCM audio chunks from browser and streams to Gnani's WebSocket API.
    """
    await websocket.accept()

    if not gnani_service.is_configured:
        await websocket.send_json({
            "type": "error",
            "message": "Gnani API key is not configured in backend/.env. Live transcription requires GNANI_API_KEY.",
        })
        await websocket.close()
        return

    stream_client = None
    try:
        stream_client = gnani_service.create_stream_client(
            language_code=language_code,
            output_mode=output_mode,
            sample_rate=16000,
        )
        await stream_client.connect()
        await websocket.send_json({"type": "connected", "message": "Connected to Gnani Prisma v3.0 Live Stream"})

        # Background task to read transcripts from Gnani and send to browser
        async def forward_gnani_events():
            try:
                async for event in stream_client:
                    if isinstance(event, StreamTranscriptEvent):
                        await websocket.send_json({
                            "type": "transcript",
                            "text": event.text,
                            "detected_language": event.detected_language_code,
                            "latency": event.latency,
                            "duration_ms": event.audio_duration_ms,
                            "segment_id": event.segment_id,
                            "timestamp": event.timestamp,
                        })
                    elif isinstance(event, StreamErrorEvent):
                        await websocket.send_json({
                            "type": "error",
                            "message": event.message,
                        })
            except Exception as e:
                logger.debug(f"Event forwarding closed: {e}")

        forwarder_task = asyncio.create_task(forward_gnani_events())

        # Receive PCM chunks from client browser and stream to Gnani
        while True:
            data = await websocket.receive_bytes()
            if data:
                await stream_client.send_audio(data)

    except WebSocketDisconnect:
        logger.info("Browser WebSocket disconnected from live transcription")
    except Exception as e:
        logger.error(f"Live transcription error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        if stream_client:
            try:
                await stream_client.close()
            except Exception:
                pass


@router.get("/transcripts", response_model=TranscriptListResponse)
def get_transcripts(
    search: Optional[str] = Query(default=None),
    language: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Return paginated transcript history with search and language filters."""
    transcripts, total = TranscriptService.list_transcripts(
        db=db, search=search, language=language, limit=limit, offset=offset
    )
    return {"total": total, "transcripts": transcripts}


@router.get("/transcripts/{transcript_id}", response_model=TranscriptDetailResponse)
def get_transcript(transcript_id: str, db: Session = Depends(get_db)):
    """Return a single transcript and any associated smart notes."""
    record = TranscriptService.get_transcript(db, transcript_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

    # Serialize notes
    notes_list = []
    for n in record.notes:
        notes_list.append({
            "id": n.id,
            "transcript_id": n.transcript_id,
            "summary": n.summary,
            "detailed_summary": n.detailed_summary,
            "key_points": json.loads(n.key_points) if n.key_points and n.key_points.startswith("[") else ([n.key_points] if n.key_points else []),
            "action_items": json.loads(n.action_items) if n.action_items and n.action_items.startswith("[") else ([n.action_items] if n.action_items else []),
            "questions": json.loads(n.questions) if n.questions and n.questions.startswith("[") else ([n.questions] if n.questions else []),
            "meeting_notes": n.meeting_notes,
            "lecture_notes": n.lecture_notes,
            "keywords": json.loads(n.keywords) if n.keywords and n.keywords.startswith("[") else ([n.keywords] if n.keywords else []),
            "provider": n.provider,
            "created_at": n.created_at,
        })

    data = {
        "id": record.id,
        "filename": record.filename,
        "transcript_text": record.transcript_text,
        "language": record.language,
        "detected_language": record.detected_language,
        "output_mode": record.output_mode,
        "duration": record.duration,
        "model": record.model,
        "status": record.status,
        "error_message": record.error_message,
        "created_at": record.created_at,
        "audio_path": record.audio_path,
        "notes": notes_list,
    }
    return data


@router.delete("/transcripts/{transcript_id}")
def delete_transcript(transcript_id: str, db: Session = Depends(get_db)):
    """Delete a transcript record and its notes."""
    success = TranscriptService.delete_transcript(db, transcript_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
    return {"message": "Transcript deleted successfully", "id": transcript_id}


@router.post("/summarize")
async def generate_smart_notes(
    req: SummarizeRequest,
    db: Session = Depends(get_db),
):
    """Generate smart notes from transcript text using the configured AI provider."""
    text_to_process = ""
    transcript_record = None

    if req.transcript_id:
        transcript_record = TranscriptService.get_transcript(db, req.transcript_id)
        if not transcript_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
        text_to_process = transcript_record.transcript_text
    elif req.text:
        text_to_process = req.text
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either transcript_id or text is required")

    notes_result = await summary_service.generate_smart_notes(text_to_process)

    # Save to database if associated with transcript_id
    if transcript_record:
        saved_note = TranscriptService.save_or_update_note(
            db=db,
            transcript_id=transcript_record.id,
            note_data=notes_result,
            provider=notes_result.get("provider", "built-in"),
        )
        notes_result["id"] = saved_note.id
        notes_result["transcript_id"] = transcript_record.id
        notes_result["created_at"] = saved_note.created_at.isoformat()

    return notes_result


@router.get("/download/{transcript_id}/pdf")
def download_pdf(transcript_id: str, db: Session = Depends(get_db)):
    """Generate and download a PDF transcript with smart notes."""
    record = TranscriptService.get_transcript(db, transcript_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

    note = record.notes[0] if record.notes else None
    pdf_bytes = pdf_service.generate_transcript_pdf(record, note)

    base_name = os.path.splitext(record.filename)[0]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="VoxNote_{base_name}.pdf"'},
    )


@router.get("/download/{transcript_id}/txt", response_class=PlainTextResponse)
def download_txt(transcript_id: str, db: Session = Depends(get_db)):
    """Download plain text transcript and smart notes."""
    record = TranscriptService.get_transcript(db, transcript_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

    note = record.notes[0] if record.notes else None

    txt_lines = [
        "===========================================================",
        "                   VOXNOTE AI TRANSCRIPT",
        "===========================================================",
        f"File Name:        {record.filename}",
        f"Language:         {record.detected_language or record.language}",
        f"Duration:         {record.duration:.1f}s ({round(record.duration / 60, 1)}m)",
        f"Output Mode:      {record.output_mode}",
        f"Model:            {record.model}",
        f"Date:             {record.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "===========================================================\n",
        "TRANSCRIPT TEXT:",
        "----------------",
        record.transcript_text,
        "\n",
    ]

    if note:
        txt_lines.extend([
            "===========================================================",
            "                      SMART NOTES",
            "===========================================================",
        ])
        if note.summary:
            txt_lines.extend(["\n[SUMMARY]:", note.summary])
        if note.key_points:
            txt_lines.extend(["\n[KEY POINTS]:", note.key_points])
        if note.action_items:
            txt_lines.extend(["\n[ACTION ITEMS]:", note.action_items])
        if note.questions:
            txt_lines.extend(["\n[QUESTIONS]:", note.questions])
        if note.meeting_notes:
            txt_lines.extend(["\n[MEETING NOTES]:", note.meeting_notes])
        if note.lecture_notes:
            txt_lines.extend(["\n[LECTURE NOTES]:", note.lecture_notes])

    base_name = os.path.splitext(record.filename)[0]
    return PlainTextResponse(
        content="\n".join(txt_lines),
        headers={"Content-Disposition": f'attachment; filename="VoxNote_{base_name}.txt"'},
    )
