import io
import os
import wave
from pathlib import Path
from typing import Tuple, List, Optional
import logging

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac", ".webm"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


class AudioService:
    @staticmethod
    def validate_audio(filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        """Validate audio file extension and size."""
        ext = Path(filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            return False, f"Unsupported file extension '{ext}'. Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        if file_size > MAX_FILE_SIZE:
            return False, f"File size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)} MB"
        if file_size == 0:
            return False, "Audio file is empty"
        return True, None

    @staticmethod
    def get_wav_duration_and_meta(file_bytes: bytes) -> Tuple[float, int, int]:
        """
        Extract duration, sample rate, and channels from WAV bytes.
        Returns: (duration_in_seconds, sample_rate, channels)
        """
        try:
            with wave.open(io.BytesIO(file_bytes), "rb") as wav_file:
                channels = wav_file.getnchannels()
                sample_rate = wav_file.getframerate()
                num_frames = wav_file.getnframes()
                duration = num_frames / float(sample_rate) if sample_rate > 0 else 0.0
                return round(duration, 2), sample_rate, channels
        except wave.Error:
            # Fallback estimation for non-wav or compressed files:
            # Standard estimation assuming ~16-32 KB/sec
            estimated_duration = max(1.0, round(len(file_bytes) / 32000.0, 2))
            return estimated_duration, 16000, 1

    @staticmethod
    def split_wav_chunks(file_bytes: bytes, chunk_seconds: int = 25) -> List[Tuple[bytes, float]]:
        """
        Split a WAV file into chunks of max `chunk_seconds` (Gnani REST limit is 30s).
        Returns a list of (chunk_bytes, chunk_duration).
        If not a valid WAV or <= chunk_seconds, returns the original bytes as single chunk.
        """
        try:
            with wave.open(io.BytesIO(file_bytes), "rb") as wav_file:
                channels = wav_file.getnchannels()
                sample_width = wav_file.getsampwidth()
                sample_rate = wav_file.getframerate()
                total_frames = wav_file.getnframes()
                total_duration = total_frames / float(sample_rate)

                if total_duration <= chunk_seconds:
                    return [(file_bytes, round(total_duration, 2))]

                frames_per_chunk = int(sample_rate * chunk_seconds)
                chunks: List[Tuple[bytes, float]] = []

                wav_file.rewind()
                while True:
                    frames = wav_file.readframes(frames_per_chunk)
                    if not frames:
                        break
                    
                    chunk_out = io.BytesIO()
                    with wave.open(chunk_out, "wb") as out_wav:
                        out_wav.setnchannels(channels)
                        out_wav.setsampwidth(sample_width)
                        out_wav.setframerate(sample_rate)
                        out_wav.writeframes(frames)
                    
                    chunk_bytes = chunk_out.getvalue()
                    chunk_dur = len(frames) / (channels * sample_width * sample_rate)
                    chunks.append((chunk_bytes, round(chunk_dur, 2)))

                return chunks
        except Exception as e:
            logger.warning(f"Could not split audio using WAV format: {e}. Processing as single unit.")
            return [(file_bytes, 10.0)]
