import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Button } from '@/shared/ui/Button'

interface DataTableProps<T> {
  datos: T[]
  columnas: ColumnDef<T>[]
  /** Texto del buscador; si no se indica, la tabla no muestra filtro. */
  filtroPlaceholder?: string
  mensajeVacio?: string
  tamanioPagina?: number
}

/** Tabla del panel con TanStack Table: orden por columna, filtro global y paginación del lado del cliente. */
export function DataTable<T>({
  datos,
  columnas,
  filtroPlaceholder,
  mensajeVacio = 'No hay registros para mostrar.',
  tamanioPagina = 10,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filtro, setFiltro] = useState('')

  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    state: { sorting, globalFilter: filtro },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltro,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: tamanioPagina } },
  })

  const filas = tabla.getRowModel().rows
  const totalFiltrado = tabla.getFilteredRowModel().rows.length

  return (
    <div className="space-y-3">
      {filtroPlaceholder && (
        <input
          type="search"
          value={filtro}
          onChange={(evento) => {
            setFiltro(evento.target.value)
            tabla.setPageIndex(0)
          }}
          placeholder={filtroPlaceholder}
          aria-label={filtroPlaceholder}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 sm:max-w-xs"
        />
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50">
            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((header) => {
                  const orden = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={orden === 'asc' ? 'ascending' : orden === 'desc' ? 'descending' : undefined}
                      className="whitespace-nowrap px-4 py-3 text-left font-semibold text-stone-700"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-orange-700"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-hidden className="text-xs text-stone-400">
                            {orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : '↕'}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="px-4 py-10 text-center text-stone-500">
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id} className="hover:bg-orange-50/40">
                  {fila.getVisibleCells().map((celda) => (
                    <td key={celda.id} className="px-4 py-3 align-middle text-stone-800">
                      {flexRender(celda.column.columnDef.cell, celda.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tabla.getPageCount() > 1 && (
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-sm text-stone-600">
            {totalFiltrado} registro(s) · página {tabla.getState().pagination.pageIndex + 1} de {tabla.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button variante="secundario" tamanio="sm" onClick={() => tabla.previousPage()} disabled={!tabla.getCanPreviousPage()}>
              ← Anterior
            </Button>
            <Button variante="secundario" tamanio="sm" onClick={() => tabla.nextPage()} disabled={!tabla.getCanNextPage()}>
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
