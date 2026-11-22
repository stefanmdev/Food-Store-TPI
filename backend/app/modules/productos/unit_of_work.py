from typing import Self

from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository
from app.modules.productos.repository import ProductoRepository


class ProductoUnitOfWork(UnitOfWork):
    """Expone productos y categorías (para validar categoria_id) sobre la misma sesión."""

    productos: ProductoRepository
    categorias: CategoriaRepository

    def __enter__(self) -> Self:
        super().__enter__()
        self.productos = ProductoRepository(self.session)
        self.categorias = CategoriaRepository(self.session)
        return self
