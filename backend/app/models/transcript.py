import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    filename = Column(String(255), nullable=False)
    transcript_text = Column(Text, nullable=False, default="")
    language = Column(String(30), nullable=False, default="indic-auto")
    detected_language = Column(String(30), nullable=True)
    output_mode = Column(String(30), nullable=False, default="transcribe")
    duration = Column(Float, nullable=False, default=0.0)
    audio_path = Column(String(500), nullable=True)
    model = Column(String(50), nullable=False, default="prisma-v3.0")
    status = Column(String(30), nullable=False, default="completed")  # completed, processing, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # One-to-many relationship with Notes
    notes = relationship("Note", back_populates="transcript", cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    transcript_id = Column(String(36), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False)
    
    summary = Column(Text, nullable=True)
    detailed_summary = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)  # JSON or bullet text
    action_items = Column(Text, nullable=True)  # JSON or bullet text
    questions = Column(Text, nullable=True)  # JSON or bullet text
    meeting_notes = Column(Text, nullable=True)
    lecture_notes = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True)  # JSON or comma-separated
    provider = Column(String(50), nullable=True, default="built-in")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    transcript = relationship("Transcript", back_populates="notes")
