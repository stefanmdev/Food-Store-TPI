import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const BASE =
  'w-full rounded-lg border bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:outline-2 focus:outline-offset-1 focus:outline-orange-500 disabled:bg-stone-100'

function clases(error?: string) {
  return `${BASE} ${error ? 'border-red-500' : 'border-stone-300'}`
}

interface CampoProps {
  id: string
  label: string
  error?: string
  ayuda?: string
  children: ReactNode
}

/** Etiqueta, control y mensaje de error/ayuda con los atributos de accesibilidad. */
function Campo({ id, label, error, ayuda, children }: CampoProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-stone-500">{ayuda}</p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  ayuda?: string
}

export function Input({ id, label, error, ayuda, className = '', ...props }: InputProps) {
  return (
    <Campo id={id} label={label} error={error} ayuda={ayuda}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${clases(error)} ${className}`}
        {...props}
      />
    </Campo>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  error?: string
}

export function Select({ id, label, error, className = '', children, ...props }: SelectProps) {
  return (
    <Campo id={id} label={label} error={error}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${clases(error)} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Campo>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  error?: string
  ayuda?: string
}

export function Textarea({ id, label, error, ayuda, className = '', ...props }: TextareaProps) {
  return (
    <Campo id={id} label={label} error={error} ayuda={ayuda}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${clases(error)} ${className}`}
        {...props}
      />
    </Campo>
  )
}
