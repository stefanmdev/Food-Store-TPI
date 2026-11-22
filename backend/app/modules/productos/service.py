from app.core.exceptions import RecursoNoEncontrado
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(RecursoNoEncontrado):
    pass


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _obtener_activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        """Un producto dado de baja se trata como inexistente."""
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado("El producto no existe.")
        return producto

    @staticmethod
    def _verificar_categoria(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("La categoría no existe o está dada de baja.")

    def listar(
        self,
        *,
        skip: int,
        limit: int,
        search: str | None,
        categoria_id: int | None,
        disponible: bool | None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, productos = uow.productos.search(
                search=search.strip() if search else None,
                categoria_id=categoria_id,
                disponible=disponible,
                skip=skip,
                limit=limit,
            )
            return ProductosPaginados(total=total, items=[ProductoRead.model_validate(p) for p in productos])

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._obtener_activo(uow, producto_id))

    def crear(self, datos: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._verificar_categoria(uow, datos.categoria_id)
            producto = uow.productos.add(Producto.model_validate(datos))
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, datos: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            cambios = datos.model_dump(exclude_unset=True)
            if "categoria_id" in cambios:
                self._verificar_categoria(uow, cambios["categoria_id"])
            producto.sqlmodel_update(cambios)
            producto = uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(self, producto_id: int, datos: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            producto.sqlmodel_update(datos.model_dump(exclude_unset=True))
            producto = uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        """Baja lógica: activo = false."""
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            producto.activo = False
            uow.session.add(producto)
