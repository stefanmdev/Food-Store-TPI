"""Categorías y productos. Datos del seed: 4 categorías (ids 1-4) y 12 productos (ids 1-12;
el 12 «Flan casero» tiene stock 0). Las pizzas son los productos 4, 5 y 6 (categoría 2)."""
from fastapi.testclient import TestClient

CAT = "/api/v1/categorias"
PROD = "/api/v1/productos"
NUEVO_PRODUCTO = {"nombre": "Empanada de carne", "precio_base": 900, "stock": 24, "categoria_id": 1}


# --- Categorías -----------------------------------------------------------------
def test_categorias_lectura_publica(anon: TestClient) -> None:
    r = anon.get(CAT)
    assert r.status_code == 200 and len(r.json()) == 4
    assert anon.get(f"{CAT}/1").json()["nombre"] == "Hamburguesas"
    assert anon.get(f"{CAT}/999").status_code == 404


def test_categorias_escritura_solo_admin(anon: TestClient, cliente: TestClient) -> None:
    datos = {"nombre": "Ensaladas"}
    assert anon.post(CAT, json=datos).status_code == 401
    assert cliente.post(CAT, json=datos).status_code == 403
    assert cliente.put(f"{CAT}/1", json=datos).status_code == 403
    assert cliente.delete(f"{CAT}/1").status_code == 403


def test_crear_categoria_valida_nombre_unico_y_largo(admin: TestClient) -> None:
    r = admin.post(CAT, json={"nombre": "  Ensaladas  ", "descripcion": "Frescas"})
    assert r.status_code == 201 and r.json()["nombre"] == "Ensaladas" and r.json()["activo"] is True
    assert admin.post(CAT, json={"nombre": "ensaladas"}).status_code == 409
    assert admin.post(CAT, json={"nombre": "E"}).status_code == 422
    assert admin.post(CAT, json={"nombre": "   "}).status_code == 422
    assert admin.post(CAT, json={"nombre": "x" * 101}).status_code == 422


def test_actualizar_categoria_parcial(admin: TestClient) -> None:
    r = admin.put(f"{CAT}/1", json={"descripcion": "Nueva descripción"})
    assert r.status_code == 200 and r.json()["nombre"] == "Hamburguesas"
    assert admin.put(f"{CAT}/1", json={"nombre": "Hamburguesas"}).status_code == 200  # conserva su propio nombre
    assert admin.put(f"{CAT}/1", json={"nombre": "Pizzas"}).status_code == 409
    assert admin.put(f"{CAT}/1", json={"nombre": None}).status_code == 422
    assert admin.put(f"{CAT}/999", json={"nombre": "Otra"}).status_code == 404


def test_baja_logica_de_categoria(admin: TestClient, anon: TestClient) -> None:
    r = admin.delete(f"{CAT}/2")
    assert r.status_code == 204 and r.content == b""
    assert anon.get(f"{CAT}/2").status_code == 404
    assert admin.put(f"{CAT}/2", json={"descripcion": "x"}).status_code == 404
    assert admin.delete(f"{CAT}/2").status_code == 404
    assert len(anon.get(CAT).json()) == 3
    assert admin.post(CAT, json={"nombre": "Pizzas"}).status_code == 409  # no libera el nombre
    # no oculta sus productos
    assert anon.get(PROD, params={"categoria_id": 2}).json()["total"] == 3


# --- Productos ------------------------------------------------------------------
def test_listado_paginado_con_busqueda_y_filtros(anon: TestClient) -> None:
    r = anon.get(PROD)
    assert r.status_code == 200 and r.json()["total"] == 12 and len(r.json()["items"]) == 12
    pagina = anon.get(PROD, params={"skip": 10, "limit": 5}).json()
    assert pagina["total"] == 12 and len(pagina["items"]) == 2
    assert anon.get(PROD, params={"search": "PIZZA"}).json()["total"] == 3
    assert anon.get(PROD, params={"search": "%"}).json()["total"] == 0  # comodín escapado
    assert anon.get(PROD, params={"categoria_id": 3}).json()["total"] == 3
    assert anon.get(PROD, params={"limit": 101}).status_code == 422
    assert anon.get(PROD, params={"skip": -1}).status_code == 422
    item = anon.get(PROD, params={"search": "napolitana"}).json()["items"][0]
    assert item["categoria"]["nombre"] == "Pizzas"


def test_filtro_disponible(admin: TestClient, anon: TestClient) -> None:
    admin.patch(f"{PROD}/1/stock", json={"disponible": False})
    assert anon.get(PROD, params={"disponible": False}).json()["total"] == 1
    assert anon.get(PROD, params={"disponible": True}).json()["total"] == 11


def test_detalle_de_producto(anon: TestClient) -> None:
    r = anon.get(f"{PROD}/5")
    assert r.status_code == 200 and r.json()["categoria"]["id"] == 2
    assert anon.get(f"{PROD}/999").status_code == 404


def test_crear_producto(admin: TestClient, cliente: TestClient) -> None:
    assert cliente.post(PROD, json=NUEVO_PRODUCTO).status_code == 403
    r = admin.post(PROD, json=NUEVO_PRODUCTO)
    assert r.status_code == 201
    assert r.json()["disponible"] is True and r.json()["activo"] is True and r.json()["categoria"]["id"] == 1
    assert admin.post(PROD, json={**NUEVO_PRODUCTO, "categoria_id": 999}).status_code == 404
    admin.delete(f"{CAT}/4")
    assert admin.post(PROD, json={**NUEVO_PRODUCTO, "categoria_id": 4}).status_code == 404
    assert admin.post(PROD, json={**NUEVO_PRODUCTO, "precio_base": -1}).status_code == 422
    assert admin.post(PROD, json={**NUEVO_PRODUCTO, "stock": -1}).status_code == 422
    assert admin.post(PROD, json={**NUEVO_PRODUCTO, "imagen_url": "no-es-url"}).status_code == 422


def test_actualizar_producto_parcial(admin: TestClient) -> None:
    antes = admin.get(f"{PROD}/1").json()
    r = admin.put(f"{PROD}/1", json={"precio_base": 5000})
    assert r.status_code == 200
    despues = r.json()
    assert despues["precio_base"] == 5000
    assert {k: v for k, v in despues.items() if k != "precio_base"} == {
        k: v for k, v in antes.items() if k != "precio_base"
    }
    assert admin.put(f"{PROD}/1", json={"categoria_id": 999}).status_code == 404
    admin.delete(f"{CAT}/3")
    assert admin.put(f"{PROD}/1", json={"categoria_id": 3}).status_code == 404
    assert admin.put(f"{PROD}/1", json={"nombre": None}).status_code == 422
    assert admin.put(f"{PROD}/999", json={"precio_base": 1}).status_code == 404


def test_patch_stock_y_disponible(admin: TestClient, cliente: TestClient) -> None:
    r = admin.patch(f"{PROD}/12/stock", json={"stock": 50, "disponible": False})
    assert r.status_code == 200 and r.json()["stock"] == 50 and r.json()["disponible"] is False
    assert admin.patch(f"{PROD}/12/stock", json={"stock": -1}).status_code == 422
    assert admin.patch(f"{PROD}/12/stock", json={}).status_code == 422
    assert admin.patch(f"{PROD}/999/stock", json={"stock": 1}).status_code == 404
    assert cliente.patch(f"{PROD}/12/stock", json={"stock": 1}).status_code == 403


def test_baja_logica_de_producto(admin: TestClient, anon: TestClient) -> None:
    r = admin.delete(f"{PROD}/1")
    assert r.status_code == 204 and r.content == b""
    assert anon.get(f"{PROD}/1").status_code == 404
    assert admin.put(f"{PROD}/1", json={"precio_base": 1}).status_code == 404
    assert admin.patch(f"{PROD}/1/stock", json={"stock": 1}).status_code == 404
    assert admin.delete(f"{PROD}/1").status_code == 404
    assert anon.get(PROD).json()["total"] == 11
