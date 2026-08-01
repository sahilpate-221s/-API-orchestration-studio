import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'
import { runLoadTest, stopLoadTest, getStats, LoadTestMode } from '../services/loadTestService'
import Workflow from '../models/Workflow'
import Execution from '../models/Execution'

const router = Router()

// ─── Start ──────────────────────────────────────────────────────────────────
router.post('/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      workflowId, targetUrl,
      method   = 'GET',
      headers  = {},
      body,
      mode     = 'spike' as LoadTestMode,
      totalUsers      = 100,
      durationSeconds = 10,
      serverCores,
      dbPoolLimit,
      maxQueueBacklog,
      serverMemoryGB,
      networkBandwidthMbps
    } = req.body

    if (!targetUrl) { res.status(400).json({ message: 'targetUrl is required' }); return }

    // Cap values to ensure high-scale parameters are clean
    const cappedUsers = Math.max(1, Math.min(totalUsers, 1_000_000))
    const cappedDur   = Math.max(1, Math.min(durationSeconds, 300))

    const loadTestId = uuidv4()
    const userId     = req.user!.id

    runLoadTest({
      loadTestId, userId, targetUrl, method, headers, body,
      mode: mode as LoadTestMode,
      totalUsers: cappedUsers,
      durationSeconds: cappedDur,
    }).catch(err => console.error('[LoadTest] fatal:', err))

    res.json({ loadTestId, mode, totalUsers: cappedUsers, durationSeconds: cappedDur, message: 'Started' })
  } catch (err) {
    console.error('Load test start error:', err)
    res.status(500).json({ message: 'Failed to start' })
  }
})

// ─── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats/:loadTestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { res.json(await getStats(req.params.loadTestId)) }
  catch { res.status(500).json({ message: 'Failed to get stats' }) }
})

// ─── Stop ───────────────────────────────────────────────────────────────────
router.post('/stop/:loadTestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { stopLoadTest(req.params.loadTestId); res.json({ message: 'Stopping' }) }
  catch { res.status(500).json({ message: 'Failed to stop' }) }
})

// ─── Save to history ────────────────────────────────────────────────────────
router.post('/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      workflowId, loadTestId, targetUrl, method,
      totalUsers, completed, successful, failed,
      successRate, avgLatency, minLatency, maxLatency,
      rps, elapsed, statusCodes, errors, speed, verdict,
    } = req.body

    const userId = req.user!.id
    let wfId: any = null
    if (workflowId) { const w = await Workflow.findOne({ _id: workflowId, userId }); if (w) wfId = w._id }
    if (!wfId)      { const w = await Workflow.findOne({ userId }); if (w) wfId = w._id }
    if (!wfId) { res.status(200).json({ message: 'No workflow' }); return }

    const idempotencyKey = `loadtest-${loadTestId}`
    const existing = await Execution.findOne({ idempotencyKey })
    if (existing) { res.json({ message: 'Already saved' }); return }

    const executionId = uuidv4()
    await Execution.create({
      executionId, workflowId: wfId, userId,
      status: successRate >= 90 ? 'success' : 'error',
      nodes: [], totalTime: elapsed * 1000,
      idempotencyKey, completedAt: new Date(),
      loadTestMeta: {
        loadTestId, targetUrl, method,
        totalUsers, completed, successful, failed,
        successRate, avgLatency, minLatency, maxLatency,
        rps, elapsed, statusCodes: statusCodes ?? {}, errors: errors ?? {}, speed: speed ?? {}, verdict: verdict ?? 'Excellent',
      },
    })
    res.json({ message: 'Saved', executionId })
  } catch (err) {
    console.error('Save error:', err)
    res.status(500).json({ message: 'Failed to save' })
  }
})

export default router