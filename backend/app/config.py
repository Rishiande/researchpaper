"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:rishi9899@localhost:5432/ResearchGate"
    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: str = "http://localhost:5173"
    APP_ENV: str = "development"
    JWT_SECRET_KEY: str = "a7f3b9c1d4e8f2a6b0c5d9e3f7a1b4c8d2e6f0a3b7c1d5e9f2a6b0c4d8e1f5"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
