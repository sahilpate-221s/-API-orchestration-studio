import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'
import { loadTestQueue } from '../config/queue'
import { initLoadTest, streamLoadTestStats, getLoadTestStats } from '../services/loadTestService'
import Workflow from '../models/Workflow'
import Execution from '../models/Execution'

const router = Router()

router.post('/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      workflowId,
      targetUrl,
      method = 'GET',
      headers = {},
      body,
      totalUsers = 1000,
      rampUpSeconds = 30,
      batchSize = 100,
    } = req.body

    if (!targetUrl) {
      res.status(400).json({ message: 'targetUrl is required' })
      return
    }

    // Cap at 1,000,000
    const cappedUsers = Math.min(totalUsers, 1000000)
    const cappedBatchSize = Math.min(batchSize, 500)

    const loadTestId = uuidv4()
    const userId = req.user!.id

    // Initialize Redis counters
    await initLoadTest(loadTestId, cappedUsers)

    // Calculate number of batches
    const totalBatches = Math.ceil(cappedUsers / cappedBatchSize)

    // Enqueue all batches
    const jobs = Array.from({ length: totalBatches }, (_, i) => ({
      name: 'load-test-batch',
      data: {
        loadTestId,
        userId,
        workflowId: workflowId ?? '',
        targetUrl,
        method,
        headers,
        body,
        batchIndex: i,
        batchSize: Math.min(
          cappedBatchSize,
          cappedUsers - i * cappedBatchSize
        ),
        totalUsers: cappedUsers,
        rampUpSeconds,
      },
    }))

    await loadTestQueue.addBulk(jobs)

    // Start streaming stats to frontend
    streamLoadTestStats(loadTestId, userId, cappedUsers)

    res.json({
      loadTestId,
      totalUsers: cappedUsers,
      totalBatches,
      batchSize: cappedBatchSize,
      rampUpSeconds,
      message: 'Load test started',
    })

  } catch (err) {
    console.error('Load test start error:', err)
    res.status(500).json({ message: 'Failed to start load test', error: err })
  }
})

router.get('/stats/:loadTestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getLoadTestStats(req.params.loadTestId)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get stats', error: err })
  }
})

router.post('/stop/:loadTestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Drain the queue for this load test
    const jobs = await loadTestQueue.getJobs(['waiting', 'delayed'])
    const toRemove = jobs.filter(
      (j) => j.data.loadTestId === req.params.loadTestId
    )
    await Promise.all(toRemove.map((j) => j.remove()))

    res.json({ message: 'Load test stopped', removed: toRemove.length })
  } catch (err) {
    res.status(500).json({ message: 'Failed to stop load test', error: err })
  }
})

// Save final load test results to execution history
router.post('/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      workflowId,
      loadTestId,
      targetUrl,
      method,
      totalUsers,
      completed,
      successful,
      failed,
      successRate,
      avgLatency,
      minLatency,
      maxLatency,
      p50,
      p95,
      p99,
      rps,
      elapsed,
      statusCodes,
      errors,
    } = req.body

    const userId = req.user!.id

    // If no workflowId, save without workflow reference using a placeholder
    let workflowObjectId: any = null
    if (workflowId) {
      const workflow = await Workflow.findOne({ _id: workflowId, userId })
      if (workflow) workflowObjectId = workflow._id
    }

    // If still no workflow, we still save — use a sentinel lookup
    if (!workflowObjectId) {
      // Try to find any workflow for this user to attach to
      const anyWorkflow = await Workflow.findOne({ userId })
      if (anyWorkflow) workflowObjectId = anyWorkflow._id
    }

    if (!workflowObjectId) {
      // No workflow at all — still record as a standalone execution
      res.status(200).json({ message: 'No workflow to attach to, skipping save' })
      return
    }

    const executionId = uuidv4()
    const idempotencyKey = `loadtest-${loadTestId}`

    // Check for duplicate
    const existing = await Execution.findOne({ idempotencyKey })
    if (existing) {
      res.json({ message: 'Already saved', executionId: existing.executionId })
      return
    }

    const overallStatus = successRate >= 90 ? 'success' : 'error'

    await Execution.create({
      executionId,
      workflowId: workflowObjectId,
      userId,
      status: overallStatus,
      nodes: [],
      totalTime: elapsed * 1000,
      idempotencyKey,
      completedAt: new Date(),
      loadTestMeta: {
        loadTestId,
        targetUrl,
        method,
        totalUsers,
        completed,
        successful,
        failed,
        successRate,
        avgLatency,
        minLatency,
        maxLatency,
        p50,
        p95,
        p99,
        rps,
        elapsed,
        statusCodes: statusCodes ?? {},
        errors: errors ?? {},
      },
    })

    res.json({ message: 'Load test saved to history', executionId })
  } catch (err) {
    console.error('Load test save error:', err)
    res.status(500).json({ message: 'Failed to save load test', error: err })
  }
})

export default router