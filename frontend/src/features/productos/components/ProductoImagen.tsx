import { useState } from 'react'

interface ProductoImagenProps {
  url: string | null
  nombre: string
  className?: string
}

/** Imagen del producto con un reemplazo si no tiene URL o si la URL no carga. */
export function ProductoImagen({ url, nombre, className = '' }: ProductoImagenProps) {
  const [fallo, setFallo] = useState(false)

  if (!url || fallo) {
    return (
      <div
        className={`flex items-center justify-center bg-linear-to-br from-orange-100 to-amber-50 text-4xl ${className}`}
        role="img"
        aria-label={`Sin imagen: ${nombre}`}
      >
        🍽️
      </div>
    )
  }
  return (
    <img src={url} alt={nombre} loading="lazy" onError={() => setFallo(true)} className={`object-cover ${className}`} />
  )
}
