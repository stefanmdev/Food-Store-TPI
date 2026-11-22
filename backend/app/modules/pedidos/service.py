"""Reglas de negocio de pedidos (RN-01 a RN-06) dentro del Unit of Work."""
from datetime import datetime, timezone

from app.core.exceptions import AccesoDenegado, RecursoNoEncontrado, ReglaDeNegocio
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado


# --- Excepciones de dominio ---------------------------------------------------
class PedidoNoEncontrado(RecursoNoEncontrado):
    pass


class PedidoAjeno(AccesoDenegado):
    pass


class StockInsuficiente(ReglaDeNegocio):
    pass


class ProductoNoDisponible(ReglaDeNegocio):
    pass


class ProductoRepetido(ReglaDeNegocio):
    pass


class TransicionInvalida(ReglaDeNegocio):
    pass


class PedidoNoCancelable(ReglaDeNegocio):
    pass


# --- RN-02: máquina de estados ---------------------------------------------------
TRANSICIONES: dict[EstadoPedido, set[EstadoPedido]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENTREGADO: set(),  # terminal
    EstadoPedido.CANCELADO: set(),  # terminal
}


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # --- helpers ------------------------------------------------------------------
    @staticmethod
    def _obtener(uow: PedidoUnitOfWork, pedido_id: int, *, bloquear: bool = False) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id, for_update=bloquear)
        if pedido is None:
            raise PedidoNoEncontrado("El pedido no existe.")
        return pedido

    @staticmethod
    def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
        """RN-03: devuelve al stock la cantidad de cada línea (misma transacción que el cambio de estado)."""
        for detalle in sorted(pedido.items, key=lambda d: d.producto_id):
            producto = uow.productos.get_by_id(detalle.producto_id, for_update=True)
            if producto is not None:
                producto.stock += detalle.cantidad
                uow.session.add(producto)

    def _transicionar(self, uow: PedidoUnitOfWork, pedido: Pedido, nuevo: EstadoPedido) -> None:
        """RN-02: toda transición se valida contra el mapa antes de modificar el pedido."""
        actual = EstadoPedido(pedido.estado)
        if nuevo not in TRANSICIONES[actual]:
            if not TRANSICIONES[actual]:
                raise TransicionInvalida(f"El pedido está {actual.value}: es un estado terminal y no admite cambios.")
            raise TransicionInvalida(f"Transición inválida: {actual.value} → {nuevo.value}.")
        if nuevo is EstadoPedido.CANCELADO:
            self._restituir_stock(uow, pedido)
        pedido.estado = nuevo.value
        pedido.updated_at = _ahora()
        uow.session.add(pedido)
        uow.session.flush()

    # --- casos de uso -------------------------------------------------------------
    def crear(self, datos: PedidoCreate, usuario_id: int) -> PedidoRead:
        """RN-01: valida, descuenta stock y crea las líneas en una sola transacción.

        Cualquier excepción dentro del bloque hace rollback en el Unit of Work:
        no se persiste el pedido ni el descuento de stock.
        """
        with self.uow as uow:
            ids = [item.producto_id for item in datos.items]
            repetidos = sorted({pid for pid in ids if ids.count(pid) > 1})
            if repetidos:
                raise ProductoRepetido(f"El producto {repetidos[0]} está repetido en el pedido.")

            pedido = uow.pedidos.add(
                Pedido(
                    usuario_id=usuario_id,
                    estado=EstadoPedido.PENDIENTE.value,
                    forma_pago=datos.forma_pago.value,
                    direccion_entrega=datos.direccion_entrega,
                    notas=datos.notas or None,
                    total=0,
                )
            )

            # Bloquea las filas de productos en orden de id para evitar ventas
            # simultáneas del mismo stock (y deadlocks entre pedidos concurrentes).
            for producto_id in sorted(set(ids)):
                uow.productos.get_by_id(producto_id, for_update=True)

            total = 0.0
            for item in datos.items:
                producto = uow.productos.get_by_id(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(f"El producto {item.producto_id} no existe.")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"El producto '{producto.nombre}' no está disponible.")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente para '{producto.nombre}': "
                        f"disponible {producto.stock}, solicitado {item.cantidad}."
                    )
                producto.stock -= item.cantidad
                uow.session.add(producto)

                subtotal = round(producto.precio_base * item.cantidad, 2)
                pedido.items.append(
                    DetallePedido(
                        producto_id=item.producto_id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,  # copia (RN-05)
                        precio_unitario=producto.precio_base,  # copia (RN-05)
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.session.add(pedido)
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    def listar(
        self,
        *,
        usuario_id: int,
        es_admin: bool,
        estado: EstadoPedido | None,
        skip: int,
        limit: int,
    ) -> PedidosPaginados:
        """RN-04: el cliente ve solo sus pedidos; el admin ve todos."""
        with self.uow as uow:
            total, pedidos = uow.pedidos.list_by_usuario(
                None if es_admin else usuario_id,
                estado=estado.value if estado else None,
                skip=skip,
                limit=limit,
            )
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in pedidos])

    def obtener(self, pedido_id: int, *, usuario_id: int, es_admin: bool) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            if not es_admin and pedido.usuario_id != usuario_id:
                raise PedidoAjeno("No tenés permiso para ver este pedido.")
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, nuevo: EstadoPedido) -> PedidoRead:
        """Admin: avanza o cancela según la máquina de estados (RN-02, RN-03)."""
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id, bloquear=True)
            self._transicionar(uow, pedido, nuevo)
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, *, usuario_id: int) -> PedidoRead:
        """Dueño: cancela su pedido solo desde PENDIENTE y restituye el stock (RN-03, RN-04)."""
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id, bloquear=True)
            if pedido.usuario_id != usuario_id:
                raise PedidoAjeno("No podés cancelar un pedido de otro usuario.")
            if pedido.estado != EstadoPedido.PENDIENTE.value:
                raise PedidoNoCancelable(
                    f"Solo se pueden cancelar pedidos en estado PENDIENTE (estado actual: {pedido.estado})."
                )
            self._transicionar(uow, pedido, EstadoPedido.CANCELADO)
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            inicio_hoy = datetime.now().astimezone().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=conteos.get(EstadoPedido.PENDIENTE.value, 0),
                en_preparacion=conteos.get(EstadoPedido.EN_PREPARACION.value, 0),
                entregados=conteos.get(EstadoPedido.ENTREGADO.value, 0),
                cancelados=conteos.get(EstadoPedido.CANCELADO.value, 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy),
                ingresos_entregados=round(uow.pedidos.sum_total_por_estado(EstadoPedido.ENTREGADO.value), 2),
            )
