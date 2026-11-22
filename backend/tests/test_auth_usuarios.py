from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from tests.conftest import app, login

AUTH = "/api/v1/auth"
USUARIOS = "/api/v1/admin/usuarios"
NUEVO = {"username": "maria", "full_name": "María Pérez", "email": "maria@mail.com", "password": "Secreta123"}


def test_registro_crea_usuario_con_rol_user_sin_exponer_password(anon: TestClient) -> None:
    r = anon.post(f"{AUTH}/register", json={**NUEVO, "role": "admin"})
    assert r.status_code == 201
    body = r.json()
    assert body["role"] == "user"  # el registro público nunca crea admins
    assert body["disabled"] is False
    assert set(body) == {"id", "username", "full_name", "email", "role", "disabled", "created_at"}


def test_registro_duplicado_responde_409(anon: TestClient) -> None:
    assert anon.post(f"{AUTH}/register", json=NUEVO).status_code == 201
    mismo_username = {**NUEVO, "email": "otro@mail.com", "username": "MARIA"}
    mismo_email = {**NUEVO, "username": "otra", "email": "Maria@Mail.com"}
    assert anon.post(f"{AUTH}/register", json=mismo_username).status_code == 409
    assert anon.post(f"{AUTH}/register", json=mismo_email).status_code == 409


def test_registro_valida_campos(anon: TestClient) -> None:
    assert anon.post(f"{AUTH}/register", json={**NUEVO, "password": "corta"}).status_code == 422
    assert anon.post(f"{AUTH}/register", json={**NUEVO, "email": "no-es-email"}).status_code == 422
    assert anon.post(f"{AUTH}/register", json={**NUEVO, "username": "   "}).status_code == 422
    assert anon.post(f"{AUTH}/register", json={"username": "x"}).status_code == 422


def test_login_entrega_cookie_httponly_y_no_devuelve_token(anon: TestClient) -> None:
    r = anon.post(f"{AUTH}/token", data={"username": "admin", "password": "Admin1234!"})
    assert r.status_code == 200
    assert r.json() == {"message": "Login exitoso"}
    set_cookie = r.headers["set-cookie"].lower()
    assert "access_token=" in set_cookie and "httponly" in set_cookie and "max-age=1800" in set_cookie
    assert "access_token" not in r.json()


def test_login_con_credenciales_incorrectas_responde_401(anon: TestClient) -> None:
    assert anon.post(f"{AUTH}/token", data={"username": "admin", "password": "mala1234"}).status_code == 401
    assert anon.post(f"{AUTH}/token", data={"username": "nadie", "password": "Admin1234!"}).status_code == 401


def test_me_y_logout(admin: TestClient, anon: TestClient) -> None:
    assert anon.get(f"{AUTH}/me").status_code == 401
    r = admin.get(f"{AUTH}/me")
    assert r.status_code == 200 and r.json()["username"] == "admin" and r.json()["role"] == "admin"
    r = admin.post(f"{AUTH}/logout")
    assert r.status_code == 200
    assert 'access_token=""' in r.headers["set-cookie"] or "max-age=0" in r.headers["set-cookie"].lower()
    assert admin.get(f"{AUTH}/me").status_code == 401


def test_token_invalido_o_vencido_responde_401() -> None:
    falso = TestClient(app, cookies={"access_token": "token.falso.123"})
    assert falso.get(f"{AUTH}/me").status_code == 401
    vencido = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    assert TestClient(app, cookies={"access_token": vencido}).get(f"{AUTH}/me").status_code == 401
    otra_firma = jwt.encode({"sub": "1"}, "x" * 40, algorithm="HS256")
    assert TestClient(app, cookies={"access_token": otra_firma}).get(f"{AUTH}/me").status_code == 401


def test_usuario_desactivado_recibe_400_en_login_y_con_sesion(admin: TestClient, cliente: TestClient) -> None:
    cliente_id = cliente.get(f"{AUTH}/me").json()["id"]
    assert admin.post(f"{USUARIOS}/{cliente_id}/desactivar").json()["disabled"] is True
    r = cliente.get(f"{AUTH}/me")  # la cookie sigue vigente pero la cuenta está desactivada
    assert r.status_code == 400 and r.json()["detail"] == "Cuenta de usuario desactivada"
    assert cliente.get("/api/v1/pedidos").status_code == 400
    r = TestClient(app).post(f"{AUTH}/token", data={"username": "cliente1", "password": "Cliente123"})
    assert r.status_code == 400 and r.json()["detail"] == "Cuenta de usuario desactivada"
    # activar devuelve el acceso
    assert admin.post(f"{USUARIOS}/{cliente_id}/activar").json()["disabled"] is False
    assert login(TestClient(app), "cliente1", "Cliente123").get(f"{AUTH}/me").status_code == 200


def test_gestion_de_usuarios_solo_admin(anon: TestClient, cliente: TestClient, admin: TestClient) -> None:
    assert anon.get(USUARIOS).status_code == 401
    assert cliente.get(USUARIOS).status_code == 403
    assert cliente.post(f"{USUARIOS}/1/desactivar").status_code == 403
    r = admin.get(USUARIOS)
    assert r.status_code == 200 and {u["username"] for u in r.json()} == {"admin", "cliente1"}
    assert all("hashed_password" not in u for u in r.json())


def test_activar_desactivar_idempotente_404_y_autodesactivacion(admin: TestClient, cliente: TestClient) -> None:
    cliente_id = cliente.get(f"{AUTH}/me").json()["id"]
    for _ in range(2):  # idempotente: 200 aunque el estado no cambie
        assert admin.post(f"{USUARIOS}/{cliente_id}/desactivar").status_code == 200
    for _ in range(2):
        assert admin.post(f"{USUARIOS}/{cliente_id}/activar").status_code == 200
    assert admin.post(f"{USUARIOS}/9999/activar").status_code == 404
    assert admin.post(f"{USUARIOS}/9999/desactivar").status_code == 404
    admin_id = admin.get(f"{AUTH}/me").json()["id"]
    r = admin.post(f"{USUARIOS}/{admin_id}/desactivar")
    assert r.status_code == 400
    assert admin.get(f"{AUTH}/me").json()["disabled"] is False


def test_cors_con_credenciales_para_el_frontend(anon: TestClient) -> None:
    r = anon.options(
        "/api/v1/productos",
        headers={"Origin": settings.FRONTEND_ORIGIN, "Access-Control-Request-Method": "GET"},
    )
    assert r.headers["access-control-allow-origin"] == settings.FRONTEND_ORIGIN
    assert r.headers["access-control-allow-credentials"] == "true"
    assert anon.get("/docs").status_code == 200 and anon.get("/redoc").status_code == 200
