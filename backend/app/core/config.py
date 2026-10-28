import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Namade Kadda API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"

    DATABASE_URL: str = "sqlite:///./namade_kadda.db"

    # MongoDB Atlas Configuration
    MONGODB_URL: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string (supports MongoDB Atlas mongodb+srv:// or local mongodb://)"
    )
    MONGODB_DATABASE: str = Field(
        default="namade_kadda",
        description="MongoDB database name"
    )

    JWT_SECRET: str = "namade-kadda-super-secret-key-2026-production-ready"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    LLM_PROVIDER: str = "demo"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "demo-deterministic-v1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_demo_mode(self) -> bool:
        return self.LLM_PROVIDER.lower() == "demo" or not self.LLM_API_KEY.strip()


settings = Settings()
