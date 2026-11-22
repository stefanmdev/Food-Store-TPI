import type { ReactNode } from 'react'

type Tipo = 'error' | 'exito' | 'info'

const ESTILOS: Record<Tipo, string> = {
  error: 'border-red-300 bg-red-50 text-red-800',
  exito: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  info: 'border-sky-300 bg-sky-50 text-sky-800',
}

interface AlertaProps {
  tipo: Tipo
  children: ReactNode
  onCerrar?: () => void
}

export function Alerta({ tipo, children, onCerrar }: AlertaProps) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${ESTILOS[tipo]}`}
    >
      <div>{children}</div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} className="font-bold opacity-70 hover:opacity-100" aria-label="Cerrar aviso">
          ×
        </button>
      )}
    </div>
  )
}
