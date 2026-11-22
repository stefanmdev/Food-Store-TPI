import { useEffect, useState } from 'react'

/** Devuelve `valor` después de `ms` sin cambios (evita una consulta por cada tecla). No obtiene datos. */
export function useDebouncedValue<T>(valor: T, ms = 350): T {
  const [demorado, setDemorado] = useState(valor)
  useEffect(() => {
    const id = window.setTimeout(() => setDemorado(valor), ms)
    return () => window.clearTimeout(id)
  }, [valor, ms])
  return demorado
}
