"""Registro de las cinco tablas del UML.

Importar este módulo antes de crear las tablas o de usar las relaciones: SQLModel
resuelve los nombres de clase de cada Relationship cuando todos los modelos están cargados.
"""
from app.modules.categorias.models import Categoria
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

__all__ = ["Usuario", "Categoria", "Producto", "Pedido", "DetallePedido"]
