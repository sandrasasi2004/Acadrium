import os
from pathlib import Path
from typing import Union, List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Acadrium Backend API"
    API_V1_STR: str = "/api"
    
    # Database Connection
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/acadrium"
    
    # JWT Security Configuration
    SECRET_KEY: str = "acadrium_super_secret_jwt_key_2026_change_this_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ]

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

settings = Settings()
