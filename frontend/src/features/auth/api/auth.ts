import { axiosInstance } from '@/shared/api/axiosInstance'
import type { MensajeResponse, UserCreate, UserPublic } from '../types/auth'

/** Login con formulario OAuth2: el JWT llega en la cookie HttpOnly, no en el cuerpo. */
export async function loginRequest(username: string, password: string): Promise<MensajeResponse> {
  const form = new URLSearchParams({ username, password })
  const { data } = await axiosInstance.post<MensajeResponse>('/auth/token', form)
  return data
}

export async function registerRequest(datos: UserCreate): Promise<UserPublic> {
  const { data } = await axiosInstance.post<UserPublic>('/auth/register', datos)
  return data
}

export async function logoutRequest(): Promise<MensajeResponse> {
  const { data } = await axiosInstance.post<MensajeResponse>('/auth/logout')
  return data
}

export async function meRequest(): Promise<UserPublic> {
  const { data } = await axiosInstance.get<UserPublic>('/auth/me')
  return data
}
