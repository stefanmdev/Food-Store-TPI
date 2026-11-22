"""Unit of Work base: una sesión por operación de negocio."""
from collections.abc import Callable
from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory as default_session_factory


class UnitOfWork:
    """Abre la sesión en __enter__; hace commit (o rollback ante error) y close en __exit__.

    Los Unit of Work de cada módulo heredan de esta clase y crean sus repositorios
    sobre la misma sesión en __enter__. Ningún Service ni Router llama a commit().
    """

    def __init__(self, session_factory: Callable[[], Session] = default_session_factory) -> None:
        self._session_factory = session_factory
        self.session: Session

    def __enter__(self) -> Self:
        self.session = self._session_factory()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                try:
                    self.session.commit()
                except Exception:
                    self.session.rollback()
                    raise
            else:
                self.session.rollback()
        finally:
            self.session.close()
