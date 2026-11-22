import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        Food Store · Trabajo Práctico Integrador · Programación IV (UTN)
      </footer>
    </div>
  )
}
