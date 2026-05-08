import api from './api'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; password: string; name: string }

export async function login(payload: LoginPayload) {
  const res = await api.post('/auth/login', payload)
  localStorage.setItem('devflow_token', res.data.token)
  localStorage.setItem('devflow_user', JSON.stringify(res.data.user))
  return res.data
}

export async function register(payload: RegisterPayload) {
  const res = await api.post('/auth/register', payload)
  localStorage.setItem('devflow_token', res.data.token)
  localStorage.setItem('devflow_user', JSON.stringify(res.data.user))
  return res.data
}

export function logout() {
  localStorage.removeItem('devflow_token')
  localStorage.removeItem('devflow_user')
  window.location.href = '/login'
}

export function getStoredUser() {
  const raw = localStorage.getItem('devflow_user')
  return raw ? JSON.parse(raw) : null
}

export function isAuthenticated() {
  return !!localStorage.getItem('devflow_token')
}
