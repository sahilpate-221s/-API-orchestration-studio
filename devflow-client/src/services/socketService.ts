import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'
    const socketUrl = apiUrl.replace(/\/api\/?$/, '')
    
    socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket'],
    })
  }
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}