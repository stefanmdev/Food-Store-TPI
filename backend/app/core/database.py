"""Motor de base de datos, creación de tablas y fábrica de sesiones."""
from sqlalchemy.engine import URL, make_url
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings


def _url_con_driver(database_url: str) -> URL:
    """Usa psycopg2 (psycopg2-binary, fijado en requirements) cuando la URL es `postgresql://`."""
    url = make_url(database_url)
    if url.drivername in ("postgresql", "postgres"):
        url = url.set(drivername="postgresql+psycopg2")
    return url


_url = _url_con_driver(settings.DATABASE_URL)
_connect_args = {"check_same_thread": False} if _url.drivername.startswith("sqlite") else {}

engine = create_engine(_url, pool_pre_ping=True, connect_args=_connect_args)


def create_all_tables() -> None:
    """Crea las tablas registradas en SQLModel.metadata (importar app.db.models antes)."""
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Abre una sesión nueva; la cierra quien la abre (el Unit of Work)."""
    return Session(engine)
