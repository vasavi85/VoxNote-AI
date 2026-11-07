import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.services.transcript_service import TranscriptService

client = TestClient(app)


def test_transcript_crud_and_summarize():
    # 1. Test summarize directly with text
    sample_text = "VoxNote AI is an intelligent transcription system for Indian languages. It supports Hindi, English, and Tamil. We should schedule a meeting next week to deploy the production system. What are the key milestones?"
    sum_resp = client.post("/api/summarize", json={"text": sample_text})
    assert sum_resp.status_code == 200
    summary_data = sum_resp.json()
    assert "summary" in summary_data
    assert "key_points" in summary_data
    assert "action_items" in summary_data
    assert "questions" in summary_data
    assert "keywords" in summary_data

    # 2. Test create transcript in DB and fetch
    db = SessionLocal()
    rec = TranscriptService.create_transcript(
        db=db,
        filename="test_audio.wav",
        transcript_text=sample_text,
        language="indic-auto",
        detected_language="hi-IN",
        output_mode="transcribe",
        duration=18.5,
    )
    rec_id = rec.id

    # Attach notes
    TranscriptService.save_or_update_note(
        db=db,
        transcript_id=rec_id,
        note_data=summary_data,
        provider="built-in",
    )
    db.close()

    # 3. Test GET /api/transcripts/{id}
    detail_resp = client.get(f"/api/transcripts/{rec_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == rec_id
    assert len(detail["notes"]) == 1

    # 4. Test download TXT
    txt_resp = client.get(f"/api/download/{rec_id}/txt")
    assert txt_resp.status_code == 200
    assert "VOXNOTE AI TRANSCRIPT" in txt_resp.text

    # 5. Test download PDF
    pdf_resp = client.get(f"/api/download/{rec_id}/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 500  # valid PDF generated

    # 6. Test delete
    del_resp = client.delete(f"/api/transcripts/{rec_id}")
    assert del_resp.status_code == 200
