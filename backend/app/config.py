import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aivoa.db")
    # gemma2-9b-it / llama-3.3-70b-versatile were the assignment-specified
    # models but have since been decommissioned by Groq; defaults below are
    # Groq's current recommended replacements (verify at console.groq.com/docs/models).
    GROQ_EXTRACTION_MODEL: str = os.getenv("GROQ_EXTRACTION_MODEL", "openai/gpt-oss-20b")
    GROQ_REASONING_MODEL: str = os.getenv("GROQ_REASONING_MODEL", "openai/gpt-oss-120b")
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")


settings = Settings()
