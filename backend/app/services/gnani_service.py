import os
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple, AsyncIterator
from app.core.config import settings
from app.services.audio_service import AudioService

# Import official gnani-vachana SDK modules and constants
from gnani.stt import (
    GnaniSTTClient,
    GnaniSTTStreamClient,
    GnaniSTTBatchClient,
    PRISMA_V3_MODEL,
    INDIC_AUTO_LANGUAGE_CODE,
    PRISMA_V3_FORMATS,
    SUPPORTED_LANGUAGES,
    STREAM_SUPPORTED_LANGUAGES,
    StreamTranscriptEvent,
    StreamConnectedEvent,
    StreamProcessingEvent,
    StreamErrorEvent,
)
from gnani.stt.exceptions import (
    APIError,
    AuthenticationError,
    InvalidAudioError,
    StreamError,
    StreamClosedError,
    GnaniSTTError,
)

logger = logging.getLogger(__name__)

# Native script names for display in the UI
LANGUAGE_METADATA = {
    "en-IN": {"name": "English (India)", "native_name": "English", "sample": "Welcome to VoxNote AI"},
    "hi-IN": {"name": "Hindi", "native_name": "हिन्दी", "sample": "नमस्कार, आप कैसे हैं?"},
    "bn-IN": {"name": "Bengali", "native_name": "বাংলা", "sample": "নমস্কার, আপনি কেমন আছেন?"},
    "mr-IN": {"name": "Marathi", "native_name": "मराठी", "sample": "नमस्कार, आपण कसे आहात?"},
    "gu-IN": {"name": "Gujarati", "native_name": "ગુજરાતી", "sample": "નમસ્તે, તમે કેમ છો?"},
    "pa-IN": {"name": "Punjabi", "native_name": "ਪੰਜਾਬੀ", "sample": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?"},
    "kn-IN": {"name": "Kannada", "native_name": "ಕನ್ನಡ", "sample": "ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?"},
    "te-IN": {"name": "Telugu", "native_name": "తెలుగు", "sample": "నమస్కారం, మీరు ఎలా ఉన్నారు?"},
    "ta-IN": {"name": "Tamil", "native_name": "தமிழ்", "sample": "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?"},
    "ml-IN": {"name": "Malayalam", "native_name": "മലയാളം", "sample": "നമസ്കാരം, സുഖമാണോ?"},
}


class GnaniService:
    def __init__(self):
        self.model = PRISMA_V3_MODEL
        self.api_key = settings.GNANI_API_KEY.strip()

    @property
    def is_configured(self) -> bool:
        """Check if a valid-looking Gnani API key is configured."""
        return bool(self.api_key and len(self.api_key) > 5)

    def _get_rest_client(self) -> GnaniSTTClient:
        """Instantiate official GnaniSTTClient."""
        if not self.is_configured:
            raise AuthenticationError(
                "Gnani API Key is not configured. Please add GNANI_API_KEY to your backend/.env file."
            )
        return GnaniSTTClient(api_key=self.api_key)

    def _get_batch_client(self) -> GnaniSTTBatchClient:
        """Instantiate official GnaniSTTBatchClient."""
        if not self.is_configured:
            raise AuthenticationError(
                "Gnani API Key is not configured. Please add GNANI_API_KEY to your backend/.env file."
            )
        return GnaniSTTBatchClient(api_key=self.api_key)

    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Return all 10 supported languages with native names."""
        result = []
        for code, name in SUPPORTED_LANGUAGES.items():
            meta = LANGUAGE_METADATA.get(code, {"name": name, "native_name": name, "sample": ""})
            result.append({
                "code": code,
                "name": meta["name"],
                "native_name": meta["native_name"],
                "sample_text": meta["sample"],
            })
        return result

    def get_output_modes(self) -> List[str]:
        """Return Prisma v3.0 supported output modes."""
        return list(PRISMA_V3_FORMATS)

    def transcribe_file(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language_code: str = "indic-auto",
        output_mode: str = "transcribe",
        keywords: Optional[List[str]] = None,
        topic: Optional[str] = None,
        speaker_names: Optional[List[str]] = None,
        language_candidates: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Transcribe audio using Gnani Prisma v3.0.
        If the audio is longer than 25 seconds, automatically splits into chunks
        and transcribes each piece with `previous_text` context chaining.
        """
        client = self._get_rest_client()

        # Validate format
        if output_mode not in PRISMA_V3_FORMATS:
            output_mode = "transcribe"

        # Validate language code
        if language_code != INDIC_AUTO_LANGUAGE_CODE and language_code not in SUPPORTED_LANGUAGES:
            language_code = INDIC_AUTO_LANGUAGE_CODE

        # Clean context parameters
        clean_keywords = [k.strip() for k in keywords if k.strip()] if keywords else None
        clean_speakers = [s.strip() for s in speaker_names if s.strip()] if speaker_names else None
        clean_topic = topic.strip() if topic and topic.strip() else None

        # Clean language candidates (only valid when language_code is indic-auto)
        clean_candidates = None
        if language_code == INDIC_AUTO_LANGUAGE_CODE and language_candidates:
            valid_c = [c for c in language_candidates if c in SUPPORTED_LANGUAGES]
            if 2 <= len(valid_c) <= 4:
                clean_candidates = valid_c

        # Split into chunks if duration > 25 seconds (Gnani REST limit is 30s)
        chunks = AudioService.split_wav_chunks(audio_bytes, chunk_seconds=25)
        total_duration = sum(dur for _, dur in chunks)

        full_transcript = []
        last_detected_lang = None
        previous_text = ""
        total_processing_time = 0.0

        try:
            for idx, (chunk_data, dur) in enumerate(chunks):
                chunk_name = f"chunk_{idx}_{filename}"
                logger.info(f"Transcribing segment {idx + 1}/{len(chunks)} ({dur}s) with Prisma v3.0")

                resp = client.transcribe_bytes(
                    audio_bytes=chunk_data,
                    filename=chunk_name,
                    language_code=language_code,
                    model=self.model,
                    format=output_mode,
                    language_candidates=clean_candidates,
                    keywords=clean_keywords,
                    topic=clean_topic,
                    previous_text=previous_text if previous_text else None,
                    speaker_names=clean_speakers,
                )

                chunk_text = resp.get("transcript", "").strip()
                if chunk_text:
                    full_transcript.append(chunk_text)
                    previous_text = " ".join(full_transcript)

                if "detected_language" in resp and resp["detected_language"]:
                    last_detected_lang = resp["detected_language"]
                
                if "processing_time" in resp:
                    total_processing_time += float(resp["processing_time"])

            combined_text = " ".join(full_transcript).strip()
            
            return {
                "success": True,
                "transcript": combined_text,
                "detected_language": last_detected_lang or (language_code if language_code != INDIC_AUTO_LANGUAGE_CODE else "en-IN"),
                "duration": total_duration,
                "model": self.model,
                "output_mode": output_mode,
                "processing_time": round(total_processing_time, 2),
                "chunks_processed": len(chunks),
            }

        except (APIError, AuthenticationError, InvalidAudioError, GnaniSTTError) as e:
            logger.error(f"Gnani STT API Error: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error during Gnani transcription: {str(e)}")
            raise GnaniSTTError(f"Transcription failed: {str(e)}")

    def create_batch_job(
        self,
        audio_bytes: bytes,
        filename: str,
        language_code: str = "indic-auto",
        output_mode: str = "transcribe",
        keywords: Optional[List[str]] = None,
        topic: Optional[str] = None,
        speaker_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Submit a batch transcription job to Gnani Batch API."""
        client = self._get_batch_client()

        # In batch, output format accepts verbatim, transcribe, codemix
        batch_format = output_mode if output_mode in ("verbatim", "transcribe", "codemix") else "transcribe"
        clean_keywords = [k.strip() for k in keywords if k.strip()] if keywords else None

        job = client.create_job(
            files=[(filename, audio_bytes)],
            language_code=language_code if language_code in SUPPORTED_LANGUAGES else "indic-auto",
            model=self.model,
            format=batch_format,
            keywords=clean_keywords,
            topic=topic,
            speaker_names=speaker_names,
            start=True,
        )

        return {
            "job_id": job.id,
            "status": job.status,
            "filename": filename,
            "model": self.model,
        }

    def get_batch_job_status(self, job_id: str) -> Dict[str, Any]:
        """Check status of a batch job."""
        client = self._get_batch_client()
        job = client.get_job(job_id)
        job.refresh()

        result = {
            "job_id": job.id,
            "status": job.status,
            "total_files": getattr(job, "total_files", None),
            "completed_files": getattr(job, "completed_files", None),
            "failed_files": getattr(job, "failed_files", None),
        }

        # If completed, fetch files/transcript
        if job.status == "COMPLETED":
            files = job.files()
            transcripts = []
            for f in files:
                transcripts.append({
                    "filename": getattr(f, "filename", "audio"),
                    "transcript": getattr(f, "transcript", ""),
                    "language": getattr(f, "language", ""),
                })
            result["files"] = transcripts

        return result

    def create_stream_client(
        self,
        language_code: str = "indic-auto",
        output_mode: str = "transcribe",
        keywords: Optional[List[str]] = None,
        language_candidates: Optional[List[str]] = None,
        sample_rate: int = 16000,
    ) -> GnaniSTTStreamClient:
        """Create and return an initialized GnaniSTTStreamClient for live streaming."""
        if not self.is_configured:
            raise AuthenticationError(
                "Gnani API Key is not configured. Please add GNANI_API_KEY to your backend/.env file."
            )

        clean_keywords = [k.strip() for k in keywords if k.strip()] if keywords else None
        clean_candidates = None
        if language_code == INDIC_AUTO_LANGUAGE_CODE and language_candidates:
            valid_c = [c for c in language_candidates if c in STREAM_SUPPORTED_LANGUAGES]
            if 2 <= len(valid_c) <= 4:
                clean_candidates = valid_c

        return GnaniSTTStreamClient(
            api_key=self.api_key,
            language_code=language_code if language_code in STREAM_SUPPORTED_LANGUAGES else INDIC_AUTO_LANGUAGE_CODE,
            model=self.model,
            format=output_mode if output_mode in PRISMA_V3_FORMATS else "transcribe",
            keywords=clean_keywords,
            language_candidates=clean_candidates,
            sample_rate=sample_rate,
        )


gnani_service = GnaniService()
