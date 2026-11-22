import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  ancho?: 'md' | 'lg'
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = 'md' }: ModalProps) {
  // Cierra con Escape (manejo de teclado; no obtiene datos).
  useEffect(() => {
    if (!abierto) return
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${ancho === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
          <h2 id="modal-titulo" className="text-lg font-semibold text-stone-900">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-2xl leading-none text-stone-500 hover:bg-stone-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
