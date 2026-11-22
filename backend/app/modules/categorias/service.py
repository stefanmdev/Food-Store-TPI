from sqlalchemy.exc import IntegrityError

from app.core.exceptions import Conflicto, RecursoNoEncontrado
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(RecursoNoEncontrado):
    pass


class NombreDuplicado(Conflicto):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _obtener_activa(repo: CategoriaRepository, categoria_id: int) -> Categoria:
        """Una categoría dada de baja se trata como inexistente."""
        categoria = repo.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("La categoría no existe.")
        return categoria

    @staticmethod
    def _verificar_nombre_libre(repo: CategoriaRepository, nombre: str, excluir_id: int | None = None) -> None:
        existente = repo.get_by_nombre(nombre)
        if existente is not None and existente.id != excluir_id:
            raise NombreDuplicado(f"Ya existe una categoría con el nombre '{existente.nombre}'.")

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._obtener_activa(uow.categorias, categoria_id))

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            self._verificar_nombre_libre(uow.categorias, datos.nombre)
            try:
                categoria = uow.categorias.add(Categoria.model_validate(datos))
            except IntegrityError as error:
                raise NombreDuplicado("Ya existe una categoría con ese nombre.") from error
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._obtener_activa(uow.categorias, categoria_id)
            cambios = datos.model_dump(exclude_unset=True)
            if "nombre" in cambios:
                self._verificar_nombre_libre(uow.categorias, cambios["nombre"], excluir_id=categoria.id)
            categoria.sqlmodel_update(cambios)
            try:
                categoria = uow.categorias.add(categoria)
            except IntegrityError as error:
                raise NombreDuplicado("Ya existe una categoría con ese nombre.") from error
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica: activo = false (conserva el nombre y no toca sus productos)."""
        with self.uow as uow:
            categoria = self._obtener_activa(uow.categorias, categoria_id)
            categoria.activo = False
            uow.session.add(categoria)
