"""Repositorio genérico: acceso a datos sin reglas de negocio."""
from collections.abc import Sequence
from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    model: type[T]

    def __init__(self, session: Session, model: type[T]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, id: int, *, for_update: bool = False) -> T | None:
        """Busca por clave primaria. Con for_update bloquea la fila hasta el fin de la transacción."""
        return self.session.get(self.model, id, with_for_update=for_update)

    def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[T]:
        return self.session.exec(select(self.model).offset(skip).limit(limit)).all()

    def add(self, entity: T) -> T:
        """Agrega la entidad y hace flush para obtener su id dentro de la transacción."""
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        self.session.delete(entity)
        self.session.flush()
