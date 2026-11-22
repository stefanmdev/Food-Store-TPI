"""Reglas de negocio RN-01 a RN-06. Datos del seed usados:
producto 1 «Hamburguesa clásica» $4500 stock 30 · producto 7 «Gaseosa cola 500 ml» $1500 stock 60 ·
producto 6 «Pizza especial» $8200 stock 10 · producto 12 «Flan casero» stock 0."""
import threading

from fastapi.testclient import TestClient
from sqlmodel import Session, func, select

from app.core.database import engine
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import ItemPedidoCreate, PedidoCreate
from app.modules.pedidos.service import PedidoService, StockInsuficiente
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from tests.conftest import stock_de

PED = "/api/v1/pedidos"
PROD = "/api/v1/productos"
DATOS = {"forma_pago": "EFECTIVO", "direccion_entrega": "Av. Siempre Viva 742"}


def pedido(*items: tuple[int, int], **extra: object) -> dict[str, object]:
    return {**DATOS, "items": [{"producto_id": p, "cantidad": c} for p, c in items], **extra}


def cantidad_pedidos() -> tuple[int, int]:
    with Session(engine) as s:
        return s.exec(select(func.count()).select_from(Pedido)).one(), s.exec(
            select(func.count()).select_from(DetallePedido)
        ).one()


# --- RN-01 ---------------------------------------------------------------------------
def test_rn01_compra_correcta_descuenta_stock_y_copia_datos(cliente: TestClient, anon: TestClient) -> None:
    r = cliente.post(PED, json=pedido((1, 2), (7, 3), notas="Sin cebolla"))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["estado"] == "PENDIENTE" and body["forma_pago"] == "EFECTIVO" and body["notas"] == "Sin cebolla"
    assert body["items"] == [
        {"producto_id": 1, "nombre_producto": "Hamburguesa clásica", "precio_unitario": 4500.0, "cantidad": 2, "subtotal": 9000.0},
        {"producto_id": 7, "nombre_producto": "Gaseosa cola 500 ml", "precio_unitario": 1500.0, "cantidad": 3, "subtotal": 4500.0},
    ]
    assert body["total"] == 13500.0
    assert stock_de(anon, 1) == 28 and stock_de(anon, 7) == 57
    assert cantidad_pedidos() == (1, 2)


def test_rn01_producto_inexistente_o_inactivo_404_sin_persistir(cliente: TestClient, admin: TestClient, anon: TestClient) -> None:
    r = cliente.post(PED, json=pedido((1, 2), (999, 1)))
    assert r.status_code == 404
    admin.delete(f"{PROD}/7")
    assert cliente.post(PED, json=pedido((7, 1))).status_code == 404
    assert stock_de(anon, 1) == 30  # el descuento del primer ítem se revirtió
    assert cantidad_pedidos() == (0, 0)


def test_rn01_producto_no_disponible_400(cliente: TestClient, admin: TestClient) -> None:
    admin.patch(f"{PROD}/1/stock", json={"disponible": False})
    r = cliente.post(PED, json=pedido((1, 1)))
    assert r.status_code == 400 and "no está disponible" in r.json()["detail"]
    assert cantidad_pedidos() == (0, 0)


def test_rn01_stock_insuficiente_400_y_rollback_completo(cliente: TestClient, anon: TestClient) -> None:
    r = cliente.post(PED, json=pedido((1, 5), (6, 11)))  # el 2.º ítem supera el stock (10)
    assert r.status_code == 400 and "Stock insuficiente" in r.json()["detail"]
    assert stock_de(anon, 1) == 30 and stock_de(anon, 6) == 10
    assert cliente.post(PED, json=pedido((12, 1))).status_code == 400  # stock 0
    assert cantidad_pedidos() == (0, 0)
    assert cliente.post(PED, json=pedido((6, 10))).status_code == 201  # exactamente el stock
    assert stock_de(anon, 6) == 0


def test_rn01_producto_repetido_400(cliente: TestClient, anon: TestClient) -> None:
    r = cliente.post(PED, json=pedido((1, 1), (7, 1), (1, 2)))
    assert r.status_code == 400 and "repetido" in r.json()["detail"]
    assert stock_de(anon, 1) == 30 and cantidad_pedidos() == (0, 0)


def test_rn01_validaciones_de_items_422(cliente: TestClient) -> None:
    assert cliente.post(PED, json=pedido()).status_code == 422  # sin ítems
    assert cliente.post(PED, json=pedido((1, 0))).status_code == 422
    assert cliente.post(PED, json=pedido((1, -2))).status_code == 422
    assert cliente.post(PED, json={"items": [{"producto_id": 1, "cantidad": 1}]}).status_code == 422
    assert cantidad_pedidos() == (0, 0)


def test_crear_pedido_requiere_sesion(anon: TestClient) -> None:
    assert anon.post(PED, json=pedido((1, 1))).status_code == 401
    assert anon.get(PED).status_code == 401


def test_rn01_concurrencia_no_vende_mas_stock_del_disponible(cliente: TestClient, anon: TestClient) -> None:
    """Dos pedidos simultáneos por las últimas 6 pizzas: uno gana y el otro recibe StockInsuficiente."""
    usuario_id = cliente.get("/api/v1/auth/me").json()["id"]
    datos = PedidoCreate(items=[ItemPedidoCreate(producto_id=6, cantidad=6)], **DATOS)
    resultados: list[str] = []

    def comprar() -> None:
        try:
            PedidoService(PedidoUnitOfWork()).crear(datos, usuario_id)
            resultados.append("ok")
        except StockInsuficiente:
            resultados.append("sin_stock")

    hilos = [threading.Thread(target=comprar) for _ in range(2)]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()
    assert sorted(resultados) == ["ok", "sin_stock"]
    assert stock_de(anon, 6) == 4


# --- RN-06 ---------------------------------------------------------------------------
def test_rn06_forma_pago_y_direccion(cliente: TestClient) -> None:
    assert cliente.post(PED, json=pedido((1, 1), forma_pago="TARJETA")).status_code == 422
    assert cliente.post(PED, json=pedido((1, 1), direccion_entrega="Av 1")).status_code == 422  # 4 caracteres
    assert cliente.post(PED, json=pedido((1, 1), direccion_entrega="x" * 201)).status_code == 422
    assert cliente.post(PED, json=pedido((1, 1), direccion_entrega="      ")).status_code == 422
    assert cliente.post(PED, json=pedido((1, 1), forma_pago="TRANSFERENCIA", direccion_entrega="Calle")).status_code == 201


# --- RN-05 ---------------------------------------------------------------------------
def test_rn05_lineas_y_total_inmutables(cliente: TestClient, admin: TestClient) -> None:
    creado = cliente.post(PED, json=pedido((1, 2))).json()
    admin.put(f"{PROD}/1", json={"nombre": "Hamburguesa renombrada", "precio_base": 9999})
    leido = cliente.get(f"{PED}/{creado['id']}").json()
    assert leido["items"] == creado["items"] and leido["total"] == 9000.0
    assert leido["items"][0]["nombre_producto"] == "Hamburguesa clásica"
    # no hay endpoints de edición ni de borrado de pedidos
    assert admin.put(f"{PED}/{creado['id']}", json={"total": 1}).status_code == 405
    assert admin.delete(f"{PED}/{creado['id']}").status_code == 405
    # avanzar el estado no cambia líneas ni total
    admin.patch(f"{PED}/{creado['id']}/estado", json={"estado": "EN_PREPARACION"})
    assert cliente.get(f"{PED}/{creado['id']}").json()["total"] == 9000.0


# --- RN-02 ---------------------------------------------------------------------------
def test_rn02_transiciones_validas_hasta_entregado(cliente: TestClient, admin: TestClient) -> None:
    pid = cliente.post(PED, json=pedido((1, 1))).json()["id"]
    r = admin.patch(f"{PED}/{pid}/estado", json={"estado": "EN_PREPARACION"})
    assert r.status_code == 200 and r.json()["estado"] == "EN_PREPARACION"
    r = admin.patch(f"{PED}/{pid}/estado", json={"estado": "ENTREGADO"})
    assert r.status_code == 200 and r.json()["estado"] == "ENTREGADO"
    for estado in ("CANCELADO", "PENDIENTE", "EN_PREPARACION", "ENTREGADO"):  # terminal
        assert admin.patch(f"{PED}/{pid}/estado", json={"estado": estado}).status_code == 400


def test_rn02_transiciones_invalidas_400(cliente: TestClient, admin: TestClient) -> None:
    pid = cliente.post(PED, json=pedido((1, 1))).json()["id"]
    assert admin.patch(f"{PED}/{pid}/estado", json={"estado": "ENTREGADO"}).status_code == 400  # salta un paso
    assert admin.patch(f"{PED}/{pid}/estado", json={"estado": "PENDIENTE"}).status_code == 400  # mismo estado
    admin.patch(f"{PED}/{pid}/estado", json={"estado": "EN_PREPARACION"})
    assert admin.patch(f"{PED}/{pid}/estado", json={"estado": "PENDIENTE"}).status_code == 400  # retroceso
    assert admin.patch(f"{PED}/{pid}/estado", json={"estado": "ENVIADO"}).status_code == 422
    assert admin.patch(f"{PED}/999/estado", json={"estado": "CANCELADO"}).status_code == 404
    assert cliente.patch(f"{PED}/{pid}/estado", json={"estado": "ENTREGADO"}).status_code == 403


# --- RN-03 ---------------------------------------------------------------------------
def test_rn03_cancelacion_del_duenio_restituye_stock_exacto(cliente: TestClient, anon: TestClient) -> None:
    pid = cliente.post(PED, json=pedido((1, 4), (7, 6))).json()["id"]
    assert (stock_de(anon, 1), stock_de(anon, 7)) == (26, 54)
    r = cliente.patch(f"{PED}/{pid}/cancelar")
    assert r.status_code == 200 and r.json()["estado"] == "CANCELADO"
    assert (stock_de(anon, 1), stock_de(anon, 7)) == (30, 60)
    # cancelación repetida: 400 y el stock no se restituye dos veces
    assert cliente.patch(f"{PED}/{pid}/cancelar").status_code == 400
    assert (stock_de(anon, 1), stock_de(anon, 7)) == (30, 60)


def test_rn03_admin_cancela_en_preparacion_y_restituye(cliente: TestClient, admin: TestClient, anon: TestClient) -> None:
    pid = cliente.post(PED, json=pedido((6, 3))).json()["id"]
    admin.patch(f"{PED}/{pid}/estado", json={"estado": "EN_PREPARACION"})
    assert cliente.patch(f"{PED}/{pid}/cancelar").status_code == 400  # el dueño solo cancela en PENDIENTE
    assert stock_de(anon, 6) == 7
    r = admin.patch(f"{PED}/{pid}/estado", json={"estado": "CANCELADO"})
    assert r.status_code == 200 and r.json()["estado"] == "CANCELADO"
    assert stock_de(anon, 6) == 10
    assert admin.patch(f"{PED}/{pid}/estado", json={"estado": "CANCELADO"}).status_code == 400
    assert stock_de(anon, 6) == 10


def test_rn03_restituye_stock_aunque_el_producto_este_dado_de_baja(cliente: TestClient, admin: TestClient) -> None:
    pid = cliente.post(PED, json=pedido((2, 5))).json()["id"]
    admin.delete(f"{PROD}/2")
    assert cliente.patch(f"{PED}/{pid}/cancelar").status_code == 200
    with Session(engine) as s:
        from app.modules.productos.models import Producto

        assert s.get(Producto, 2).stock == 20  # type: ignore[union-attr]


# --- RN-04 ---------------------------------------------------------------------------
def test_rn04_permisos_por_duenio_y_rol(cliente: TestClient, cliente2: TestClient, admin: TestClient) -> None:
    p1 = cliente.post(PED, json=pedido((1, 1))).json()["id"]
    p2 = cliente2.post(PED, json=pedido((7, 1))).json()["id"]
    p3 = admin.post(PED, json=pedido((8, 1))).json()["id"]  # el admin también puede comprar

    assert cliente2.get(f"{PED}/{p1}").status_code == 403
    assert cliente2.patch(f"{PED}/{p1}/cancelar").status_code == 403
    assert admin.patch(f"{PED}/{p1}/cancelar").status_code == 403  # /cancelar es solo del dueño
    assert cliente.get(f"{PED}/999").status_code == 404
    assert cliente.get(f"{PED}/{p1}").status_code == 200
    assert admin.get(f"{PED}/{p2}").status_code == 200

    propios = cliente.get(PED).json()
    assert propios["total"] == 1 and [p["id"] for p in propios["items"]] == [p1]
    todos = admin.get(PED).json()
    assert todos["total"] == 3 and {p["id"] for p in todos["items"]} == {p1, p2, p3}


def test_listado_de_pedidos_paginado_y_filtrado(cliente: TestClient, admin: TestClient) -> None:
    ids = [cliente.post(PED, json=pedido((1, 1))).json()["id"] for _ in range(3)]
    admin.patch(f"{PED}/{ids[0]}/estado", json={"estado": "EN_PREPARACION"})
    r = cliente.get(PED, params={"limit": 2})
    assert r.json()["total"] == 3 and len(r.json()["items"]) == 2
    assert r.json()["items"][0]["id"] == ids[2]  # más reciente primero
    assert cliente.get(PED, params={"estado": "PENDIENTE"}).json()["total"] == 2
    assert admin.get(PED, params={"estado": "EN_PREPARACION"}).json()["total"] == 1
    assert cliente.get(PED, params={"estado": "OTRO"}).status_code == 422
    assert cliente.get(PED, params={"limit": 101}).status_code == 422


# --- Resumen -------------------------------------------------------------------------
def test_resumen_del_panel(cliente: TestClient, admin: TestClient) -> None:
    assert cliente.get(f"{PED}/resumen").status_code == 403
    vacio = admin.get(f"{PED}/resumen").json()
    assert vacio == {"pendientes": 0, "en_preparacion": 0, "entregados": 0, "cancelados": 0,
                     "pedidos_hoy": 0, "ingresos_entregados": 0.0}

    a = cliente.post(PED, json=pedido((1, 2))).json()["id"]  # 9000 → ENTREGADO
    b = cliente.post(PED, json=pedido((7, 1))).json()["id"]  # 1500 → ENTREGADO
    c = cliente.post(PED, json=pedido((8, 1))).json()["id"]  # 1000 → EN_PREPARACION
    d = cliente.post(PED, json=pedido((9, 1))).json()["id"]  # 1800 → CANCELADO
    cliente.post(PED, json=pedido((10, 1)))  # 2200 → PENDIENTE
    for pid in (a, b, c):
        admin.patch(f"{PED}/{pid}/estado", json={"estado": "EN_PREPARACION"})
    for pid in (a, b):
        admin.patch(f"{PED}/{pid}/estado", json={"estado": "ENTREGADO"})
    cliente.patch(f"{PED}/{d}/cancelar")

    assert admin.get(f"{PED}/resumen").json() == {
        "pendientes": 1, "en_preparacion": 1, "entregados": 2, "cancelados": 1,
        "pedidos_hoy": 5, "ingresos_entregados": 10500.0,
    }
