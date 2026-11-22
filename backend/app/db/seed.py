"""Carga inicial idempotente: python -m app.db.seed

Crea el usuario admin, 4 categorías y 12 productos (11 con stock). Si se ejecuta
de nuevo no duplica nada: busca cada registro antes de crearlo.
"""
import app.db.models  # noqa: F401  (registra las tablas y relaciones)
from sqlmodel import select

from app.core.config import settings
from app.core.database import create_all_tables
from app.core.security import hash_password
from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.productos.models import Producto
from app.modules.productos.repository import ProductoRepository
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository
from app.modules.usuarios.schemas import Rol


def _img(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?w=600&q=70&auto=format&fit=crop"


CATEGORIAS: dict[str, str] = {
    "Hamburguesas": "Hamburguesas caseras con pan de papa.",
    "Pizzas": "Pizzas a la piedra de 8 porciones.",
    "Bebidas": "Bebidas frías.",
    "Postres": "Postres caseros.",
}

# (categoría, nombre, descripción, precio, stock, imagen)
PRODUCTOS: list[tuple[str, str, str, float, int, str | None]] = [
    ("Hamburguesas", "Hamburguesa clásica", "Medallón de carne, lechuga, tomate y queso.", 4500, 30, _img("1568901346375-23c9450c58cd")),
    ("Hamburguesas", "Hamburguesa doble cheddar", "Doble medallón, doble cheddar y panceta.", 6200, 20, _img("1550547660-d9450f859349")),
    ("Hamburguesas", "Combo hamburguesa con papas", "Hamburguesa clásica con porción de papas fritas.", 6800, 15, _img("1571091718767-18b5b1457add")),
    ("Pizzas", "Pizza muzzarella", "Salsa de tomate, muzzarella y aceitunas.", 7000, 15, _img("1594007654729-407eedc4be65")),
    ("Pizzas", "Pizza napolitana", "Muzzarella, rodajas de tomate, ajo y orégano.", 7800, 12, _img("1574071318508-1cdbab80d002")),
    ("Pizzas", "Pizza especial", "Muzzarella, jamón, morrones y huevo.", 8200, 10, _img("1565299624946-b28f40a0ae38")),
    ("Bebidas", "Gaseosa cola 500 ml", "Lata o botella individual.", 1500, 60, _img("1554866585-cd94860890b7")),
    ("Bebidas", "Agua mineral 500 ml", "Sin gas.", 1000, 80, _img("1548839140-29a749e1cf4d")),
    ("Bebidas", "Limonada con menta", "Limonada natural con menta y jengibre.", 1800, 40, _img("1621263764928-df1444c5e859")),
    ("Postres", "Helado 2 bochas", "Elegí dos gustos.", 2200, 25, _img("1563805042-7684c019e1cb")),
    ("Postres", "Brownie con helado", "Brownie tibio con una bocha de helado.", 3200, 18, _img("1606313564200-e75d5e30476c")),
    ("Postres", "Flan casero", "Con dulce de leche. Sin stock para mostrar el estado agotado.", 2000, 0, None),
]


def seed() -> dict[str, int]:
    create_all_tables()
    creados = {"usuarios": 0, "categorias": 0, "productos": 0}

    with UnitOfWork() as uow:
        usuarios = UsuarioRepository(uow.session)
        categorias = CategoriaRepository(uow.session)
        productos = ProductoRepository(uow.session)

        if usuarios.get_by_username(settings.SEED_ADMIN_USERNAME) is None:
            usuarios.add(
                Usuario(
                    username=settings.SEED_ADMIN_USERNAME,
                    full_name="Administrador Food Store",
                    email=settings.SEED_ADMIN_EMAIL,
                    hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
                    role=Rol.ADMIN.value,
                )
            )
            creados["usuarios"] += 1

        por_nombre: dict[str, Categoria] = {}
        for nombre, descripcion in CATEGORIAS.items():
            categoria = categorias.get_by_nombre(nombre)
            if categoria is None:
                categoria = categorias.add(Categoria(nombre=nombre, descripcion=descripcion))
                creados["categorias"] += 1
            por_nombre[nombre] = categoria

        for cat, nombre, descripcion, precio, stock, imagen in PRODUCTOS:
            existente = uow.session.exec(select(Producto).where(Producto.nombre == nombre)).first()
            if existente is None:
                productos.add(
                    Producto(
                        categoria_id=por_nombre[cat].id,
                        nombre=nombre,
                        descripcion=descripcion,
                        precio_base=precio,
                        stock=stock,
                        imagen_url=imagen,
                    )
                )
                creados["productos"] += 1

    return creados


if __name__ == "__main__":
    resultado = seed()
    print(
        "Seed completado. Registros nuevos: "
        f"{resultado['usuarios']} usuario(s), {resultado['categorias']} categoría(s), "
        f"{resultado['productos']} producto(s)."
    )
    print(f"Usuario administrador: {settings.SEED_ADMIN_USERNAME} (rol admin)")
