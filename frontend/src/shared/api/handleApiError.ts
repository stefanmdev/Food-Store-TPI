import axios from 'axios'

interface ErrorValidacion {
  loc?: (string | number)[]
  msg?: string
}

const CAMPOS: Record<string, string> = {
  direccion_entrega: 'Dirección de entrega',
  forma_pago: 'Forma de pago',
  password: 'Contraseña',
  precio_base: 'Precio',
  imagen_url: 'URL de imagen',
  categoria_id: 'Categoría',
  full_name: 'Nombre completo',
}

function describirValidacion(item: ErrorValidacion): string {
  const campo = item.loc?.filter((parte) => parte !== 'body').join('.') ?? ''
  const nombre = CAMPOS[campo] ?? campo
  return nombre ? `${nombre}: ${item.msg ?? 'valor inválido'}` : (item.msg ?? 'Valor inválido')
}

/** Convierte el `detail` de la API (texto o lista de errores 422) en un mensaje para la pantalla. */
export function handleApiError(error: unknown): string {
  if (!axios.isAxiosError<{ detail?: unknown }>(error)) {
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
  }
  if (error.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder.'
  if (!error.response) return 'No se pudo conectar con el servidor. Verificá que la API esté en ejecución.'

  const { status, data } = error.response
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return (detail as ErrorValidacion[]).map(describirValidacion).join(' · ')
  }
  if (status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente.'
  if (status === 403) return 'No tenés permisos para realizar esta operación.'
  if (status === 404) return 'El recurso solicitado no existe.'
  if (status >= 500) return 'Error del servidor. Intentá nuevamente en unos minutos.'
  return 'No se pudo completar la operación.'
}

export function statusDeError(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}
