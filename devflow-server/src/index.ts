import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { connectDB } from './config/database'
import authRoutes from './routes/auth'
import workflowRoutes from './routes/workflows'
import executionRoutes from './routes/execution'
import aiRoutes from './routes/ai'
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

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Start
connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})