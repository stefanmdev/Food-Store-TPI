from app.core.exceptions import Conflicto, RecursoNoEncontrado, ReglaDeNegocio
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioNoEncontrado(RecursoNoEncontrado):
    pass


class UsuarioDuplicado(Conflicto):
    pass


class AutoDesactivacion(ReglaDeNegocio):
    pass


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def obtener(self, usuario_id: int) -> UserPublic | None:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            return UserPublic.model_validate(usuario) if usuario else None

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.list_all()]

    def activar(self, usuario_id: int) -> UserPublic:
        """Alta lógica idempotente: responde 200 aunque ya estuviera activo."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado("El usuario no existe.")
            usuario.disabled = False
            uow.session.add(usuario)
            return UserPublic.model_validate(usuario)

    def desactivar(self, usuario_id: int, admin_id: int) -> UserPublic:
        """Baja lógica idempotente; el admin no puede desactivarse a sí mismo."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado("El usuario no existe.")
            if usuario.id == admin_id:
                raise AutoDesactivacion("No podés desactivar tu propia cuenta.")
            usuario.disabled = True
            uow.session.add(usuario)
            return UserPublic.model_validate(usuario)
