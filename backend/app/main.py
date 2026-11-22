from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

import app.db.models  # noqa: F401  (registra las tablas y relaciones)
from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_all_tables()
    yield


app = FastAPI(
    title="Food Store API",
    version="1.0.0",
    description="Trabajo Práctico Integrador · Programación IV (UTN). "
    "Para probar endpoints con sesión: ejecutar POST /api/v1/auth/token (el navegador guarda la cookie HttpOnly).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(auth_router)
api_v1.include_router(usuarios_router)
api_v1.include_router(categorias_router)
api_v1.include_router(productos_router)
api_v1.include_router(pedidos_router)
app.include_router(api_v1)


@app.get("/", include_in_schema=False)
def inicio() -> RedirectResponse:
    return RedirectResponse(url="/docs")
