import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { workflowQueue } from '../config/queue'
import { getRateLimitStatus } from '../services/rateLimiter'
import Workflow from '../models/Workflow'
import Execution from '../models/Execution'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Get usage/rate limit status
router.get('/usage', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const usage = await getRateLimitStatus(req.user!.id)
    res.json(usage)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
})

// Run workflow — enqueue job
router.post('/:workflowId/run', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.workflowId,
      userId: req.user!.id,
    })

    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found' })
      return
    }

    // Idempotency key — client sends this or we generate one
    const idempotencyKey = req.headers['x-idempotency-key'] as string ?? uuidv4()

    // Check if this exact execution already exists
    const existing = await Execution.findOne({ idempotencyKey })
    if (existing) {
      res.json({ message: 'Already running', executionId: existing.executionId })
      return
    }

    const executionId = uuidv4()

    // Save execution record immediately as queued
    await Execution.create({
      executionId,
      workflowId: workflow._id,
      userId: req.user!.id,
      status: 'queued',
      nodes: [],
      totalTime: 0,
      idempotencyKey,
    })

    // Enqueue the job
    const job = await workflowQueue.add(
      'run-workflow',
      {
        workflowId: req.params.workflowId,
        userId: req.user!.id,
        nodes: workflow.nodes,
        edges: workflow.edges,
        executionId,
        idempotencyKey,
      },
      { jobId: executionId }
    )

    res.json({ message: 'Queued', executionId, jobId: job.id })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
})

// Get execution history for a workflow
router.get('/:workflowId/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const executions = await Execution.find({
      workflowId: req.params.workflowId,
      userId: req.user!.id,
    })
      .sort({ triggeredAt: -1 })
      .limit(20)
      .select('executionId status totalTime triggeredAt completedAt nodes')

    res.json({ executions })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
})

// Get single execution detail
router.get('/detail/:executionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const execution = await Execution.findOne({
      executionId: req.params.executionId,
      userId: req.user!.id,
    })

    if (!execution) {
      res.status(404).json({ message: 'Execution not found' })
      return
    }

    res.json({ execution })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
})


export default router
