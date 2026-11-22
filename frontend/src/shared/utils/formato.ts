const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const fecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

export function formatPrecio(valor: number): string {
  return moneda.format(valor)
}

export function formatFecha(iso: string): string {
  return fecha.format(new Date(iso))
}
