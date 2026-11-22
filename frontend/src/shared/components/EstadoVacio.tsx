import type { ReactNode } from 'react'

interface EstadoVacioProps {
  titulo: string
  descripcion?: string
  icono?: string
  accion?: ReactNode
}

export function EstadoVacio({ titulo, descripcion, icono = '🍽️', accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>
        {icono}
      </span>
      <h2 className="text-lg font-semibold text-stone-800">{titulo}</h2>
      {descripcion && <p className="max-w-md text-stone-600">{descripcion}</p>}
      {accion && <div className="mt-3">{accion}</div>}
    </div>
  )
}
