from typing import Annotated

from pydantic import StringConstraints, model_validator
from sqlmodel import SQLModel

NombreCategoria = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
Descripcion = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class CategoriaCreate(SQLModel):
    nombre: NombreCategoria
    descripcion: Descripcion | None = None


class CategoriaUpdate(SQLModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    nombre: NombreCategoria | None = None
    descripcion: Descripcion | None = None

    @model_validator(mode="after")
    def nombre_no_nulo(self) -> "CategoriaUpdate":
        if "nombre" in self.model_fields_set and self.nombre is None:
            raise ValueError("nombre no puede ser null")
        return self


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None
    activo: bool
