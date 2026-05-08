import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devflow_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If token expired, clear storage and fire a custom event — the Router will handle redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('devflow_token')
      localStorage.removeItem('devflow_user')
      // Dispatch event so the auth store reacts without breaking React Router navigation
      window.dispatchEvent(new Event('devflow:unauthorized'))
    }
    return Promise.reject(err)
  }
)

export default api
