from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class LanguageInfo(BaseModel):
    code: str
    name: str
    native_name: str
    sample_text: str


class LanguagesResponse(BaseModel):
    languages: List[LanguageInfo]
    auto_detect_code: str = "indic-auto"
    output_modes: List[str]
    streaming_supported: List[str]


class NoteBase(BaseModel):
    summary: Optional[str] = None
    detailed_summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    questions: Optional[List[str]] = None
    meeting_notes: Optional[str] = None
    lecture_notes: Optional[str] = None
    keywords: Optional[List[str]] = None
    provider: Optional[str] = None


class NoteResponse(NoteBase):
    id: str
    transcript_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TranscriptBase(BaseModel):
    filename: str
    transcript_text: str
    language: str
    detected_language: Optional[str] = None
    output_mode: str
    duration: float
    model: str = "prisma-v3.0"
    status: str = "completed"
    error_message: Optional[str] = None


class TranscriptResponse(TranscriptBase):
    id: str
    created_at: datetime
    audio_path: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class TranscriptDetailResponse(TranscriptResponse):
    notes: List[NoteResponse] = []


class TranscriptListResponse(BaseModel):
    total: int
    transcripts: List[TranscriptResponse]


class SummarizeRequest(BaseModel):
    transcript_id: Optional[str] = None
    text: Optional[str] = None
    options: Optional[List[str]] = Field(
        default=["summary", "key_points", "action_items", "questions", "meeting_notes", "lecture_notes", "keywords"]
    )


class HealthResponse(BaseModel):
    status: str
    version: str
    gnani: Dict[str, Any]
    summary_provider: Dict[str, Any]
    database: Dict[str, Any]
