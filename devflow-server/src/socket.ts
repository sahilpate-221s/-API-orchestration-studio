import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'

const app = express()
const httpServer = createServer(app)

const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const subClient = pubClient.duplicate()

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient),
})

export { app, httpServer }
