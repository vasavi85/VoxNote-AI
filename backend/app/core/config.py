import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load backend/.env if it exists
backend_dir = Path(__file__).resolve().parent.parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseModel):
    PROJECT_NAME: str = "VoxNote AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Gnani AI Configuration
    GNANI_API_KEY: str = os.getenv("GNANI_API_KEY", "")
    GNANI_MODEL: str = "prisma-v3.0"
    GNANI_DEFAULT_LANGUAGE: str = "indic-auto"
    GNANI_DEFAULT_FORMAT: str = "transcribe"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{backend_dir / 'voxnote.db'}")
    
    # Smart Notes / Summary AI Provider
    SUMMARY_PROVIDER: str = os.getenv("SUMMARY_PROVIDER", "built-in")  # gemini, openai, anthropic, or built-in
    SUMMARY_API_KEY: str = os.getenv("SUMMARY_API_KEY", "")
    
    # Upload storage directory
    UPLOAD_DIR: Path = backend_dir / "uploads"
    
    # Server & CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
