import api from './api'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; password: string; name: string }

function normalizeUser(user: any) {
  return {
    ...user,
    id: user.id ?? user._id,
    _id: user._id ?? user.id,
  }
}

export async function login(payload: LoginPayload) {
  const res = await api.post('/auth/login', payload)
  const user = normalizeUser(res.data.user)
  localStorage.setItem('devflow_token', res.data.token)
  localStorage.setItem('devflow_user', JSON.stringify(user))
  return { ...res.data, user }
}

export async function register(payload: RegisterPayload) {
  const res = await api.post('/auth/register', payload)
  const user = normalizeUser(res.data.user)
  localStorage.setItem('devflow_token', res.data.token)
  localStorage.setItem('devflow_user', JSON.stringify(user))
  return { ...res.data, user }
}

export function logout() {
  localStorage.removeItem('devflow_token')
  localStorage.removeItem('devflow_user')
  window.location.href = '/login'
}

export function getStoredUser() {
  const raw = localStorage.getItem('devflow_user')
  if (!raw) return null
  const user = JSON.parse(raw)
  return normalizeUser(user)
}

export function isAuthenticated() {
  return !!localStorage.getItem('devflow_token')
}