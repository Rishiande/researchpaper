"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:rishi9899@localhost:5432/ResearchGate"
    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: str = "http://localhost:5173"
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
