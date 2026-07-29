import { create } from 'zustand'
import { getStoredUser, isAuthenticated, logout } from '../services/authService'

type User = {
  _id?: string
  id?: string
  email: string
  name: string
}

type AuthStore = {
  user: User | null
  isAuth: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => {
  window.addEventListener('devflow:unauthorized', () => {
    logout()
    set({ user: null, isAuth: false })
  })

  return {
    user: getStoredUser(),
    isAuth: isAuthenticated(),

    setAuth: (user, token) => {
      localStorage.setItem('devflow_token', token)
      localStorage.setItem('devflow_user', JSON.stringify(user))
      set({ user, isAuth: true })
    },

    clearAuth: () => {
      logout()
      set({ user: null, isAuth: false })
    },
  }
})