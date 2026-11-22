import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'

interface ConfirmDialogProps {
  abierto: boolean
  titulo: string
  children: ReactNode
  textoConfirmar: string
  peligro?: boolean
  procesando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmDialog({
  abierto,
  titulo,
  children,
  textoConfirmar,
  peligro = false,
  procesando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCancelar}>
      <div className="space-y-5">
        <div className="text-stone-700">{children}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variante="secundario" onClick={onCancelar} disabled={procesando}>
            Volver
          </Button>
          <Button variante={peligro ? 'peligro' : 'primario'} onClick={onConfirmar} cargando={procesando}>
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
