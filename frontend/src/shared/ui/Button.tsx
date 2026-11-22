import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type Tamanio = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanio?: Tamanio
  cargando?: boolean
}

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-orange-600 text-white hover:bg-orange-700 focus-visible:outline-orange-600',
  secundario: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 focus-visible:outline-stone-500',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  fantasma: 'text-stone-700 hover:bg-stone-100 focus-visible:outline-stone-500',
}

const TAMANIOS: Record<Tamanio, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm sm:text-base',
}

export function Button({
  variante = 'primario',
  tamanio = 'md',
  cargando = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANIOS[tamanio]} ${className}`}
      {...props}
    >
      {cargando && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  )
}
