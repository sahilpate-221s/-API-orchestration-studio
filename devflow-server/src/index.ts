import 'dotenv/config'
import cors from 'cors'
import express, { Request, Response } from 'express'
import { connectDB } from './config/database'
import authRoutes from './routes/auth'
import workflowRoutes from './routes/workflows'
import executionRoutes from './routes/execution'
import aiRoutes from './routes/ai'
import loadTestRoutes from './routes/loadtest'
import templateRoutes from './routes/templates'
import userRoutes from './routes/user'
import { app, httpServer, io } from './socket'
import './config/redis'
import { apiRateLimit } from './middleware/rateLimits'

const PORT = process.env.PORT ?? 5000

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use('/api', apiRateLimit)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/workflows', workflowRoutes)
app.use('/api/execution', executionRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/loadtest', loadTestRoutes)
app.use('/api/user', userRoutes)

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join_workflow', (workflowId: string) => {
    socket.join(workflowId)
    console.log(`Socket ${socket.id} joined workflow ${workflowId}`)
  })

  socket.on('leave_workflow', (workflowId: string) => {
    socket.leave(workflowId)
  })

   // New — load test room
  socket.on('join_loadtest', (userId: string) => {
    socket.join(`loadtest:${userId}`)
    console.log(`Socket ${socket.id} joined loadtest room for user ${userId}`)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

import { startWorker } from './worker'

// Start
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    
    // In production deployments (e.g. Render, Heroku) we often only have one web process.
    // Start the worker in the same process unless explicitly disabled.
    if (process.env.START_WORKER !== 'false') {
      console.log('Starting internal worker process...')
      startWorker().catch(console.error)
    }
  })
})