from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def list_by_usuario(
        self,
        usuario_id: int | None,
        *,
        estado: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[int, Sequence[Pedido]]:
        """Pedidos de un usuario (o de todos si usuario_id es None), del más reciente al más antiguo."""
        condiciones = []
        if usuario_id is not None:
            condiciones.append(Pedido.usuario_id == usuario_id)
        if estado is not None:
            condiciones.append(Pedido.estado == estado)

        total = self.session.exec(select(func.count()).select_from(Pedido).where(*condiciones)).one()
        consulta = (
            select(Pedido)
            .where(*condiciones)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
            .order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        )
        return total, self.session.exec(consulta).all()

    def count_by_estado(self) -> dict[str, int]:
        consulta = select(Pedido.estado, func.count(col(Pedido.id))).group_by(Pedido.estado)
        return {estado: cantidad for estado, cantidad in self.session.exec(consulta).all()}

    def count_desde(self, desde: datetime) -> int:
        consulta = select(func.count(col(Pedido.id))).where(Pedido.created_at >= desde)
        return self.session.exec(consulta).one()

    def sum_total_por_estado(self, estado: str) -> float:
        consulta = select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == estado)
        return float(self.session.exec(consulta).one())
