import { handleApiError } from '@/shared/api/handleApiError'
import { Button } from '@/shared/ui/Button'

interface EstadoErrorProps {
  error: unknown
  onReintentar?: () => void
}

export function EstadoError({ error, onReintentar }: EstadoErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <span className="text-4xl" aria-hidden>
        ⚠️
      </span>
      <h2 className="text-lg font-semibold text-red-800">No pudimos cargar la información</h2>
      <p className="max-w-md text-red-700">{handleApiError(error)}</p>
      {onReintentar && (
        <Button variante="secundario" className="mt-2" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
