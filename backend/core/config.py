import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List

# Base workspace directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

@dataclass
class Settings:
    """Application configuration settings for CLINOVA."""

    # Project Identity
    PROJECT_NAME: str = "CLINOVA"
    PROJECT_FULL_NAME: str = "Clinical Knowledge Discovery and Readmission Intelligence Platform"
    TAGLINE: str = "Discover Beyond Data."
    VERSION: str = "1.0.0"

    # Runtime Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "5050"))

    # Security & Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "clinova_clinical_kdd_secret_key_9985456b")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # Relational Database URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR}/storage/clinova.db"
    )

    # Storage Paths
    STORAGE_DIR: Path = BASE_DIR / "storage"
    RAW_DATASETS_DIR: Path = BASE_DIR / "storage" / "raw"
    PROCESSED_DATASETS_DIR: Path = BASE_DIR / "storage" / "processed"
    REPORTS_DIR: Path = BASE_DIR / "storage" / "reports"

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = field(default_factory=lambda: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ])

    def __post_init__(self):
        # Ensure critical storage directories exist
        self.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        self.RAW_DATASETS_DIR.mkdir(parents=True, exist_ok=True)
        self.PROCESSED_DATASETS_DIR.mkdir(parents=True, exist_ok=True)
        self.REPORTS_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()

