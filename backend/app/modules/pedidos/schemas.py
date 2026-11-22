from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import Field as PydanticField
from pydantic import StringConstraints
from sqlmodel import SQLModel


class EstadoPedido(str, Enum):
    PENDIENTE = "PENDIENTE"
    EN_PREPARACION = "EN_PREPARACION"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


class FormaPago(str, Enum):
    EFECTIVO = "EFECTIVO"
    TRANSFERENCIA = "TRANSFERENCIA"


DireccionEntrega = Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=200)]
Notas = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class ItemPedidoCreate(SQLModel):
    producto_id: int
    cantidad: Annotated[int, PydanticField(ge=1)]


class PedidoCreate(SQLModel):
    """RN-06: forma_pago EFECTIVO | TRANSFERENCIA y direccion_entrega de 5 a 200 caracteres."""

    items: Annotated[list[ItemPedidoCreate], PydanticField(min_length=1)]
    forma_pago: FormaPago
    direccion_entrega: DireccionEntrega
    notas: Notas | None = None


class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: EstadoPedido
    forma_pago: FormaPago
    direccion_entrega: str
    notas: str | None
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[DetallePedidoRead]


class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


class CambioEstado(SQLModel):
    estado: EstadoPedido


class ResumenPedidos(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
