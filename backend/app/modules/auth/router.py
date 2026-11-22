from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import UsuarioActual
from app.core.exceptions import ErrorDominio, a_http_exception, respuestas
from app.core.security import COOKIE_NAME
from app.modules.auth.schemas import MensajeResponse
from app.modules.auth.service import AuthService
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Autenticación"])

_COOKIE_OPCIONES = {"httponly": True, "secure": settings.COOKIE_SECURE, "samesite": "lax", "path": "/"}


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Registro público (rol user)",
    responses=respuestas(409),
)
def register(datos: UserCreate, service: AuthServiceDep) -> UserPublic:
    try:
        return service.registrar(datos)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.post(
    "/token",
    response_model=MensajeResponse,
    summary="Login con formulario OAuth2",
    description="Valida username y password y entrega el JWT en la cookie HttpOnly `access_token`. "
    "El cuerpo de la respuesta no incluye el token.",
    responses=respuestas(400, 401),
)
def login(
    formulario: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    service: AuthServiceDep,
) -> MensajeResponse:
    try:
        token = service.autenticar(formulario.username, formulario.password)
    except ErrorDominio as error:
        raise a_http_exception(error) from error
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **_COOKIE_OPCIONES,
    )
    return MensajeResponse(message="Login exitoso")


@router.post("/logout", response_model=MensajeResponse, summary="Cierra la sesión (borra la cookie)")
def logout(response: Response) -> MensajeResponse:
    response.delete_cookie(key=COOKIE_NAME, **_COOKIE_OPCIONES)
    return MensajeResponse(message="Logout exitoso")


@router.get("/me", response_model=UserPublic, summary="Usuario autenticado", responses=respuestas(400, 401))
def me(usuario: UsuarioActual) -> UserPublic:
    return usuario
