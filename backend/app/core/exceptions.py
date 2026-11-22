"""Excepciones de dominio base y su traducción a HTTP.

Cada módulo define sus excepciones concretas en su service.py heredando de estas
clases (por ejemplo, ProductoNoEncontrado(RecursoNoEncontrado)). El Router las
captura con try/except y las convierte en HTTPException con `a_http_exception`.
"""
from fastapi import HTTPException, status


class ErrorDominio(Exception):
    """Base de todas las excepciones de negocio."""

    def __init__(self, mensaje: str) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje


class NoAutenticado(ErrorDominio):
    """401: credenciales incorrectas o sesión inválida."""


class RecursoNoEncontrado(ErrorDominio):
    """404: el recurso no existe o fue dado de baja."""


class AccesoDenegado(ErrorDominio):
    """403: el recurso pertenece a otro usuario."""


class Conflicto(ErrorDominio):
    """409: viola una restricción de unicidad."""


class ReglaDeNegocio(ErrorDominio):
    """400: la operación no cumple una regla de negocio."""


_CODIGOS: list[tuple[type[ErrorDominio], int]] = [
    (NoAutenticado, status.HTTP_401_UNAUTHORIZED),
    (RecursoNoEncontrado, status.HTTP_404_NOT_FOUND),
    (AccesoDenegado, status.HTTP_403_FORBIDDEN),
    (Conflicto, status.HTTP_409_CONFLICT),
    (ReglaDeNegocio, status.HTTP_400_BAD_REQUEST),
]


def a_http_exception(error: ErrorDominio) -> HTTPException:
    """Traduce una excepción de dominio al HTTPException con el código de la especificación."""
    for clase, codigo in _CODIGOS:
        if isinstance(error, clase):
            return HTTPException(status_code=codigo, detail=error.mensaje)
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.mensaje)


def respuestas(*codigos: int) -> dict[int | str, dict[str, str]]:
    """Documenta en OpenAPI los códigos de error propios de un endpoint."""
    descripciones = {
        400: "Regla de negocio no cumplida o cuenta desactivada",
        401: "Sin sesión válida (cookie ausente, inválida o vencida)",
        403: "Rol no permitido o recurso de otro usuario",
        404: "Recurso inexistente o dado de baja",
        409: "Valor único duplicado",
    }
    return {codigo: {"description": descripciones[codigo]} for codigo in codigos}
