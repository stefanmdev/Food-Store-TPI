from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AdminActual
from app.core.exceptions import ErrorDominio, a_http_exception, respuestas
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork

router = APIRouter(prefix="/productos", tags=["Productos"])


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


ProductoServiceDep = Annotated[ProductoService, Depends(get_producto_service)]


@router.get("", response_model=ProductosPaginados, summary="Lista paginada de productos activos")
def listar_productos(
    service: ProductoServiceDep,
    skip: Annotated[int, Query(ge=0, description="Registros a saltear")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Máximo de registros (1 a 100)")] = 20,
    search: Annotated[str | None, Query(max_length=100, description="Busca en el nombre sin distinguir mayúsculas")] = None,
    categoria_id: Annotated[int | None, Query(description="Filtra por categoría")] = None,
    disponible: Annotated[bool | None, Query(description="Filtra por disponibilidad")] = None,
) -> ProductosPaginados:
    return service.listar(
        skip=skip, limit=limit, search=search, categoria_id=categoria_id, disponible=disponible
    )


@router.get("/{id}", response_model=ProductoRead, summary="Detalle con su categoría", responses=respuestas(404))
def obtener_producto(id: int, service: ProductoServiceDep) -> ProductoRead:
    try:
        return service.obtener(id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.post(
    "",
    response_model=ProductoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un producto",
    description="404 si la categoría no existe o está dada de baja.",
    responses=respuestas(401, 403, 404),
)
def crear_producto(datos: ProductoCreate, _: AdminActual, service: ProductoServiceDep) -> ProductoRead:
    try:
        return service.crear(datos)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.put(
    "/{id}",
    response_model=ProductoRead,
    summary="Actualiza los campos enviados",
    description="404 si el producto no existe o si la nueva categoría no existe o está dada de baja.",
    responses=respuestas(401, 403, 404),
)
def actualizar_producto(
    id: int, datos: ProductoUpdate, _: AdminActual, service: ProductoServiceDep
) -> ProductoRead:
    try:
        return service.actualizar(id, datos)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.patch(
    "/{id}/stock",
    response_model=ProductoRead,
    summary="Actualiza stock y disponible",
    responses=respuestas(401, 403, 404),
)
def actualizar_stock(
    id: int, datos: ProductoStockUpdate, _: AdminActual, service: ProductoServiceDep
) -> ProductoRead:
    try:
        return service.actualizar_stock(id, datos)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Baja lógica (activo = false)",
    responses=respuestas(401, 403, 404),
)
def eliminar_producto(id: int, _: AdminActual, service: ProductoServiceDep) -> None:
    try:
        service.eliminar(id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error
