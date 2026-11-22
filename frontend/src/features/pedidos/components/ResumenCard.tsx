interface ResumenCardProps {
  titulo: string
  valor: string | number
  icono: string
  color: string
}

export function ResumenCard({ titulo, valor, icono, color }: ResumenCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-full text-2xl ${color}`} aria-hidden>
        {icono}
      </span>
      <div>
        <h2 className="text-sm font-medium text-stone-600">{titulo}</h2>
        <p className="text-2xl font-bold text-stone-900">{valor}</p>
      </div>
    </article>
  )
}
