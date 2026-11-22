"""Configuración de la aplicación leída desde variables de entorno o el archivo .env."""
from pathlib import Path

from pydantic import Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    # Obligatorias: sin valor por defecto para no dejar credenciales en el código.
    DATABASE_URL: str = Field(min_length=1)
    SECRET_KEY: str = Field(min_length=32)

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=1)
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    COOKIE_SECURE: bool = False

    # Usuario administrador que crea el seed (valores de desarrollo indicados por la consigna).
    SEED_ADMIN_USERNAME: str = "admin"
    SEED_ADMIN_PASSWORD: str = "Admin1234!"
    SEED_ADMIN_EMAIL: str = "admin@foodstore.com"

    @field_validator("DATABASE_URL", "SECRET_KEY", "FRONTEND_ORIGIN")
    @classmethod
    def sin_espacios(cls, value: str) -> str:
        return value.strip()


def cargar_settings() -> Settings:
    try:
        return Settings()  # type: ignore[call-arg]
    except ValidationError as error:
        faltantes = ", ".join(str(e["loc"][0]) for e in error.errors())
        raise RuntimeError(
            f"Configuración inválida o incompleta ({faltantes}). "
            "Copiá backend/.env.example como backend/.env y completá DATABASE_URL y SECRET_KEY "
            "(SECRET_KEY debe tener al menos 32 caracteres)."
        ) from None


settings = cargar_settings()
