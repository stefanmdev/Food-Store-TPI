from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


def ahora() -> datetime:
    return datetime.now(timezone.utc)


class Pedido(SQLModel, table=True):
    """Los pedidos no se borran: se cancelan (RN-05)."""

    id: int | None = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    estado: str = Field(default="PENDIENTE", max_length=20, index=True)
    forma_pago: str = Field(max_length=20)  # EFECTIVO | TRANSFERENCIA (RN-06)
    direccion_entrega: str = Field(max_length=200)  # 5 a 200 caracteres (RN-06)
    notas: str | None = Field(default=None)
    total: float = Field(default=0)  # suma de los subtotales; fijo desde la creación (RN-05)
    created_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))

    # Usuario 1:N Pedido
    usuario: "Usuario" = Relationship(back_populates="pedidos")
    # Pedido 1:N DetallePedido (composición: las líneas pertenecen al pedido)
    items: list["DetallePedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "DetallePedido.id"},
    )


class DetallePedido(SQLModel, table=True):
    """Línea inmutable con copia del nombre y del precio del producto (RN-05)."""

    __tablename__ = "detalle_pedido"
    __table_args__ = (UniqueConstraint("pedido_id", "producto_id", name="uq_detalle_pedido_producto"),)

    id: int | None = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    cantidad: int  # >= 1 (validado en el schema)
    nombre_producto: str = Field(max_length=150)
    precio_unitario: float
    subtotal: float  # precio_unitario * cantidad

    # Pedido 1:N DetallePedido
    pedido: Pedido = Relationship(back_populates="items")
    # Producto 1:N DetallePedido
    producto: "Producto" = Relationship(back_populates="detalles")
