from collections.abc import Sequence

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def search(
        self,
        *,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[int, Sequence[Producto]]:
        """Productos activos filtrados por nombre (sin distinguir mayúsculas), categoría y disponibilidad."""
        condiciones = [col(Producto.activo).is_(True)]
        if search:
            # Se escapan % y _ para que se busquen como texto literal.
            texto = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            condiciones.append(col(Producto.nombre).ilike(f"%{texto}%", escape="\\"))
        if categoria_id is not None:
            condiciones.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            condiciones.append(Producto.disponible == disponible)

        total = self.session.exec(select(func.count()).select_from(Producto).where(*condiciones)).one()
        consulta = (
            select(Producto)
            .where(*condiciones)
            .options(selectinload(Producto.categoria))  # type: ignore[arg-type]
            .order_by(Producto.nombre, Producto.id)
            .offset(skip)
            .limit(limit)
        )
        return total, self.session.exec(consulta).all()
