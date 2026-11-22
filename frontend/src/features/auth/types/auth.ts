export type Rol = 'user' | 'admin'

/** UserPublic del backend (nunca incluye la contraseña). */
export interface UserPublic {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
  disabled: boolean
  created_at: string
}

export interface UserCreate {
  username: string
  full_name: string
  email: string
  password: string
}

export interface MensajeResponse {
  message: string
}

/** Datos del usuario que se persisten en el navegador (nunca el token). */
export type UsuarioSesion = Pick<UserPublic, 'id' | 'username' | 'full_name' | 'email' | 'role'>
