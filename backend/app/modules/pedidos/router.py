from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import AdminActual, UsuarioActual
from app.core.exceptions import ErrorDominio, a_http_exception, respuestas
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import PedidoService
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.schemas import Rol

router = APIRouter(prefix="/pedidos", tags=["Pedidos"], responses=respuestas(401))


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


PedidoServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]


@router.post(
    "",
    response_model=PedidoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crea el pedido desde el carrito (RN-01)",
    description="Transacción única: valida productos, descuenta stock y copia nombre y precio en cada línea. "
    "404 producto inexistente o inactivo; 400 stock insuficiente, producto no disponible o repetido.",
    responses=respuestas(400, 404),
)
def crear_pedido(datos: PedidoCreate, usuario: UsuarioActual, service: PedidoServiceDep) -> PedidoRead:
    try:
        return service.crear(datos, usuario_id=usuario.id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.get(
    "",
    response_model=PedidosPaginados,
    summary="Pedidos propios (user) o todos (admin)",
)
def listar_pedidos(
    usuario: UsuarioActual,
    service: PedidoServiceDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: Annotated[EstadoPedido | None, Query(description="Filtra por estado")] = None,
) -> PedidosPaginados:
    return service.listar(
        usuario_id=usuario.id,
        es_admin=usuario.role == Rol.ADMIN,
        estado=estado,
        skip=skip,
        limit=limit,
    )


# Se declara antes de /{id} para que "resumen" no se interprete como un id.
@router.get(
    "/resumen",
    response_model=ResumenPedidos,
    summary="Indicadores del panel (admin)",
    responses=respuestas(403),
)
def resumen_pedidos(_: AdminActual, service: PedidoServiceDep) -> ResumenPedidos:
    return service.resumen()


@router.get(
    "/{id}",
    response_model=PedidoRead,
    summary="Detalle con sus líneas (dueño o admin)",
    responses=respuestas(403, 404),
)
def obtener_pedido(id: int, usuario: UsuarioActual, service: PedidoServiceDep) -> PedidoRead:
    try:
        return service.obtener(id, usuario_id=usuario.id, es_admin=usuario.role == Rol.ADMIN)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.patch(
    "/{id}/estado",
    response_model=PedidoRead,
    summary="Avanza o cancela según la máquina de estados (admin, RN-02/RN-03)",
    responses=respuestas(400, 403, 404),
)
def cambiar_estado_pedido(
    id: int, datos: CambioEstado, _: AdminActual, service: PedidoServiceDep
) -> PedidoRead:
    try:
        return service.cambiar_estado(id, datos.estado)
    except ErrorDominio as error:
        raise a_http_exception(error) from error


@router.patch(
    "/{id}/cancelar",
    response_model=PedidoRead,
    summary="Cancela un pedido propio en PENDIENTE (RN-03, RN-04)",
    responses=respuestas(400, 403, 404),
)
def cancelar_pedido(id: int, usuario: UsuarioActual, service: PedidoServiceDep) -> PedidoRead:
    try:
        return service.cancelar(id, usuario_id=usuario.id)
    except ErrorDominio as error:
        raise a_http_exception(error) from error
