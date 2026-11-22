from typing import Annotated

from pydantic import Field as PydanticField
from pydantic import StringConstraints, model_validator
from sqlmodel import SQLModel

from app.modules.categorias.schemas import CategoriaRead

NombreProducto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Descripcion = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]
ImagenUrl = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500, pattern=r"^https?://\S+$")]
Precio = Annotated[float, PydanticField(ge=0, allow_inf_nan=False)]
Stock = Annotated[int, PydanticField(ge=0)]


class ProductoCreate(SQLModel):
    nombre: NombreProducto
    descripcion: Descripcion | None = None
    precio_base: Precio
    imagen_url: ImagenUrl | None = None
    stock: Stock = 0
    disponible: bool = True
    categoria_id: int


def _rechazar_nulos(modelo: SQLModel, campos: tuple[str, ...]) -> None:
    """En una actualización parcial, un campo obligatorio puede omitirse pero no enviarse como null."""
    for campo in campos:
        if campo in modelo.model_fields_set and getattr(modelo, campo) is None:
            raise ValueError(f"{campo} no puede ser null")


class ProductoUpdate(SQLModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    nombre: NombreProducto | None = None
    descripcion: Descripcion | None = None
    precio_base: Precio | None = None
    imagen_url: ImagenUrl | None = None
    stock: Stock | None = None
    disponible: bool | None = None
    categoria_id: int | None = None

    @model_validator(mode="after")
    def obligatorios_no_nulos(self) -> "ProductoUpdate":
        _rechazar_nulos(self, ("nombre", "precio_base", "stock", "disponible", "categoria_id"))
        return self


class ProductoStockUpdate(SQLModel):
    stock: Stock | None = None
    disponible: bool | None = None

    @model_validator(mode="after")
    def al_menos_un_campo(self) -> "ProductoStockUpdate":
        if not self.model_fields_set:
            raise ValueError("Enviá stock y/o disponible")
        _rechazar_nulos(self, ("stock", "disponible"))
        return self


class ProductoRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None
    precio_base: float
    imagen_url: str | None
    stock: int
    disponible: bool
    categoria_id: int
    activo: bool
    categoria: CategoriaRead


class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]
