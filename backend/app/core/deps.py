"""Dependencias de sesión y rol para los routers."""
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie

from app.core.security import COOKIE_NAME, decode_access_token
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

# Documenta en /docs que la sesión viaja en la cookie HttpOnly `access_token`.
cookie_scheme = APIKeyCookie(
    name=COOKIE_NAME,
    auto_error=False,
    description="JWT en cookie HttpOnly. Se obtiene con POST /api/v1/auth/token.",
)

CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"


def _sin_sesion() -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado: sesión ausente, inválida o vencida.")


def get_current_user(token: Annotated[str | None, Depends(cookie_scheme)]) -> UserPublic:
    """Lee la cookie, valida firma y expiración y carga el usuario (401 si algo falla)."""
    if not token:
        raise _sin_sesion()
    subject = decode_access_token(token)
    if subject is None or not subject.isdigit():
        raise _sin_sesion()
    usuario = UsuarioService(UsuarioUnitOfWork()).obtener(int(subject))
    if usuario is None:
        raise _sin_sesion()
    return usuario


def get_current_active_user(usuario: Annotated[UserPublic, Depends(get_current_user)]) -> UserPublic:
    """Rechaza usuarios con baja lógica (disabled = true) con 400."""
    if usuario.disabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, CUENTA_DESACTIVADA)
    return usuario


def require_role(roles: list[str]) -> Callable[[UserPublic], UserPublic]:
    """Crea una dependencia que exige uno de los roles indicados (403 si no lo tiene)."""

    def verificar_rol(usuario: Annotated[UserPublic, Depends(get_current_active_user)]) -> UserPublic:
        if usuario.role.value not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tenés permisos para realizar esta operación.")
        return usuario

    return verificar_rol


UsuarioActual = Annotated[UserPublic, Depends(get_current_active_user)]
AdminActual = Annotated[UserPublic, Depends(require_role(["admin"]))]
