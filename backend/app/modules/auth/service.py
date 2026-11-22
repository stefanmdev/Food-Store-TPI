from sqlalchemy.exc import IntegrityError

from app.core.deps import CUENTA_DESACTIVADA
from app.core.exceptions import NoAutenticado, ReglaDeNegocio
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import Rol, UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioDuplicado
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

# Se verifica contra un hash ficticio cuando el usuario no existe para que la
# respuesta tarde lo mismo y no revele qué usernames están registrados.
_HASH_FICTICIO = hash_password("hash-ficticio-para-comparar-tiempos")


class CredencialesInvalidas(NoAutenticado):
    pass


class CuentaDesactivada(ReglaDeNegocio):
    pass


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, datos: UserCreate) -> UserPublic:
        """Registro público: siempre crea usuarios con rol `user`."""
        with self.uow as uow:
            if uow.usuarios.get_by_username(datos.username):
                raise UsuarioDuplicado("El username ya está registrado.")
            if uow.usuarios.get_by_email(datos.email):
                raise UsuarioDuplicado("El email ya está registrado.")
            usuario = Usuario(
                username=datos.username,
                full_name=datos.full_name,
                email=datos.email.lower(),
                hashed_password=hash_password(datos.password),
                role=Rol.USER.value,
            )
            try:
                usuario = uow.usuarios.add(usuario)
            except IntegrityError as error:  # carrera entre dos registros simultáneos
                raise UsuarioDuplicado("El username o el email ya están registrados.") from error
            return UserPublic.model_validate(usuario)

    def autenticar(self, username: str, password: str) -> str:
        """Valida credenciales y devuelve el JWT (que el router coloca en la cookie)."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            hash_guardado = usuario.hashed_password if usuario else _HASH_FICTICIO
            if not verify_password(password, hash_guardado) or usuario is None:
                raise CredencialesInvalidas("Usuario o contraseña incorrectos.")
            if usuario.disabled:
                raise CuentaDesactivada(CUENTA_DESACTIVADA)
            return create_access_token(str(usuario.id))
