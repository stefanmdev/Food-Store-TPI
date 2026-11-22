"""Pruebas contra PostgreSQL real en una base separada (<base>_test).

La base de pruebas se deriva de DATABASE_URL (.env) agregando el sufijo `_test`,
o se toma de TEST_DATABASE_URL. Antes de cada prueba se vacían las tablas y se
ejecuta el seed, así cada caso parte del mismo estado conocido.
"""
import os
from collections.abc import Callable, Iterator
from pathlib import Path

import pytest
from dotenv import dotenv_values
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

BACKEND = Path(__file__).resolve().parents[1]


def _test_database_url() -> str:
    explicita = os.environ.get("TEST_DATABASE_URL")
    if explicita:
        return explicita
    base = os.environ.get("DATABASE_URL") or dotenv_values(BACKEND / ".env").get("DATABASE_URL")
    if not base:
        raise RuntimeError("Configurar DATABASE_URL en backend/.env o TEST_DATABASE_URL para correr las pruebas.")
    url = make_url(base)
    return url.set(database=f"{url.database}_test").render_as_string(hide_password=False)


TEST_URL = _test_database_url()
_url = make_url(TEST_URL)
assert _url.database and _url.database.endswith("_test"), "Las pruebas solo corren sobre una base *_test"

# Crea la base de pruebas si no existe (conectándose a la base de mantenimiento `postgres`).
if _url.get_backend_name() == "postgresql":
    admin_url = _url.set(drivername="postgresql+psycopg2", database="postgres")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        existe = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": _url.database}).scalar()
        if not existe:
            conn.execute(text(f'CREATE DATABASE "{_url.database}"'))
    admin_engine.dispose()

# La configuración se lee al importar la app: se fija la base de pruebas antes.
os.environ["DATABASE_URL"] = TEST_URL

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import SQLModel  # noqa: E402

import app.db.models  # noqa: E402,F401
from app.core.database import engine  # noqa: E402
from app.db.seed import seed  # noqa: E402
from app.main import app  # noqa: E402

ADMIN = {"username": "admin", "password": "Admin1234!"}


@pytest.fixture(scope="session", autouse=True)
def _esquema() -> Iterator[None]:
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def _datos_iniciales() -> None:
    tablas = ", ".join(t.name for t in SQLModel.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tablas} RESTART IDENTITY CASCADE"))
    seed()


def login(client: TestClient, username: str, password: str) -> TestClient:
    r = client.post("/api/v1/auth/token", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return client


@pytest.fixture
def anon() -> TestClient:
    return TestClient(app)


@pytest.fixture
def admin() -> TestClient:
    return login(TestClient(app), **ADMIN)


@pytest.fixture
def crear_cliente() -> Callable[[str], TestClient]:
    def _crear(username: str) -> TestClient:
        client = TestClient(app)
        r = client.post(
            "/api/v1/auth/register",
            json={
                "username": username,
                "full_name": f"Cliente {username}",
                "email": f"{username}@mail.com",
                "password": "Cliente123",
            },
        )
        assert r.status_code == 201, r.text
        return login(client, username, "Cliente123")

    return _crear


@pytest.fixture
def cliente(crear_cliente: Callable[[str], TestClient]) -> TestClient:
    return crear_cliente("cliente1")


@pytest.fixture
def cliente2(crear_cliente: Callable[[str], TestClient]) -> TestClient:
    return crear_cliente("cliente2")


def stock_de(client: TestClient, producto_id: int) -> int:
    r = client.get(f"/api/v1/productos/{producto_id}")
    assert r.status_code == 200, r.text
    return r.json()["stock"]
