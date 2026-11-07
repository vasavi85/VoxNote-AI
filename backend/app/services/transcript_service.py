import json
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.transcript import Transcript, Note
from app.schemas.transcript import NoteBase


class TranscriptService:
    @staticmethod
    def create_transcript(
        db: Session,
        filename: str,
        transcript_text: str,
        language: str,
        detected_language: Optional[str],
        output_mode: str,
        duration: float,
        audio_path: Optional[str] = None,
        model: str = "prisma-v3.0",
        status: str = "completed",
        error_message: Optional[str] = None,
    ) -> Transcript:
        """Create and persist a new transcript record."""
        record = Transcript(
            filename=filename,
            transcript_text=transcript_text,
            language=language,
            detected_language=detected_language,
            output_mode=output_mode,
            duration=round(duration, 2),
            audio_path=audio_path,
            model=model,
            status=status,
            error_message=error_message,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_transcript(db: Session, transcript_id: str) -> Optional[Transcript]:
        """Fetch a transcript by its unique ID."""
        return db.query(Transcript).filter(Transcript.id == transcript_id).first()

    @staticmethod
    def list_transcripts(
        db: Session,
        search: Optional[str] = None,
        language: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Transcript], int]:
        """Fetch transcripts with search, language filtering, and pagination."""
        query = db.query(Transcript)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                (Transcript.filename.ilike(term)) | (Transcript.transcript_text.ilike(term))
            )

        if language and language.strip() and language != "all":
            query = query.filter(
                (Transcript.language == language) | (Transcript.detected_language == language)
            )

        total = query.count()
        records = (
            query.order_by(desc(Transcript.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )
        return records, total

    @staticmethod
    def delete_transcript(db: Session, transcript_id: str) -> bool:
        """Delete a transcript and its associated smart notes."""
        record = db.query(Transcript).filter(Transcript.id == transcript_id).first()
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True

    @staticmethod
    def save_or_update_note(
        db: Session,
        transcript_id: str,
        note_data: Dict[str, Any],
        provider: str = "built-in",
    ) -> Note:
        """Save or update smart notes associated with a transcript."""
        existing = db.query(Note).filter(Note.transcript_id == transcript_id).first()

        key_points_json = json.dumps(note_data.get("key_points", [])) if isinstance(note_data.get("key_points"), list) else note_data.get("key_points")
        action_items_json = json.dumps(note_data.get("action_items", [])) if isinstance(note_data.get("action_items"), list) else note_data.get("action_items")
        questions_json = json.dumps(note_data.get("questions", [])) if isinstance(note_data.get("questions"), list) else note_data.get("questions")
        keywords_json = json.dumps(note_data.get("keywords", [])) if isinstance(note_data.get("keywords"), list) else note_data.get("keywords")

        if existing:
            existing.summary = note_data.get("summary")
            existing.detailed_summary = note_data.get("detailed_summary")
            existing.key_points = key_points_json
            existing.action_items = action_items_json
            existing.questions = questions_json
            existing.meeting_notes = note_data.get("meeting_notes")
            existing.lecture_notes = note_data.get("lecture_notes")
            existing.keywords = keywords_json
            existing.provider = provider
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_note = Note(
                transcript_id=transcript_id,
                summary=note_data.get("summary"),
                detailed_summary=note_data.get("detailed_summary"),
                key_points=key_points_json,
                action_items=action_items_json,
                questions=questions_json,
                meeting_notes=note_data.get("meeting_notes"),
                lecture_notes=note_data.get("lecture_notes"),
                keywords=keywords_json,
                provider=provider,
            )
            db.add(new_note)
            db.commit()
            db.refresh(new_note)
            return new_note

    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict[str, Any]:
        """Aggregate metrics for the Dashboard."""
        total_recordings = db.query(Transcript).count()
        total_seconds = db.query(func.sum(Transcript.duration)).scalar() or 0.0
        total_minutes = round(total_seconds / 60.0, 1)

        # Language distribution
        lang_counts = (
            db.query(
                func.coalesce(Transcript.detected_language, Transcript.language).label("lang"),
                func.count(Transcript.id),
            )
            .group_by("lang")
            .all()
        )
        language_stats = {lang: count for lang, count in lang_counts if lang}

        recent_transcripts = (
            db.query(Transcript)
            .order_by(desc(Transcript.created_at))
            .limit(5)
            .all()
        )

        return {
            "total_recordings": total_recordings,
            "total_transcription_minutes": total_minutes,
            "language_stats": language_stats,
            "recent_transcripts": recent_transcripts,
        }
