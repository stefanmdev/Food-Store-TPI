from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.deps import AdminActual
from app.core.exceptions import ErrorDominio, a_http_exception, respuestas
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaService
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


CategoriaServiceDep = Annotated[CategoriaService, Depends(get_categoria_service)]


@router.get("", response_model=list[CategoriaRead], summary="Lista las categorías activas")
def listar_categorias(service: CategoriaServiceDep) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{id}", response_model=CategoriaRead, summary="Detalle de una categoría", responses=respuestas(404))
def obtener_categoria(id: int, service: CategoriaServiceDep) -> CategoriaRead:
    try:
        return service.obtener(id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.post(
    "",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crea una categoría (nombre único)",
    responses=respuestas(401, 403, 409),
)
def crear_categoria(datos: CategoriaCreate, _: AdminActual, service: CategoriaServiceDep) -> CategoriaRead:
    try:
        return service.crear(datos)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.put(
    "/{id}",
    response_model=CategoriaRead,
    summary="Actualiza los campos enviados",
    responses=respuestas(401, 403, 404, 409),
)
def actualizar_categoria(
    id: int, datos: CategoriaUpdate, _: AdminActual, service: CategoriaServiceDep
) -> CategoriaRead:
    try:
        return service.actualizar(id, datos)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Baja lógica (activo = false)",
    responses=respuestas(401, 403, 404),
)
def eliminar_categoria(id: int, _: AdminActual, service: CategoriaServiceDep) -> None:
    try:
        service.eliminar(id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error
