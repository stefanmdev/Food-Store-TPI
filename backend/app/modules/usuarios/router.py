from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import AdminActual
from app.core.exceptions import ErrorDominio, a_http_exception, respuestas
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios (admin)"], responses=respuestas(401, 403))


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


UsuarioServiceDep = Annotated[UsuarioService, Depends(get_usuario_service)]


@router.get("", response_model=list[UserPublic], summary="Listado de usuarios")
def listar_usuarios(_: AdminActual, service: UsuarioServiceDep) -> list[UserPublic]:
    return service.listar()


@router.post(
    "/{id}/activar",
    response_model=UserPublic,
    summary="Alta lógica (disabled = false)",
    responses=respuestas(404),
)
def activar_usuario(id: int, _: AdminActual, service: UsuarioServiceDep) -> UserPublic:
    try:
        return service.activar(id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.post(
    "/{id}/desactivar",
    response_model=UserPublic,
    summary="Baja lógica (disabled = true)",
    description="Idempotente. El admin no puede desactivarse a sí mismo (400).",
    responses=respuestas(400, 404),
)
def desactivar_usuario(id: int, admin: AdminActual, service: UsuarioServiceDep) -> UserPublic:
    try:
        return service.desactivar(id, admin_id=admin.id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error
