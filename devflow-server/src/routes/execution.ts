import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { executeWorkflow } from '../services/executionService'
import { getRateLimitStatus } from '../services/rateLimiter'
import Workflow from '../models/Workflow'
import { Response } from 'express'

const router = Router()

router.get('/usage', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const usage = await getRateLimitStatus(req.user!.id)
    res.json(usage)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
})

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

    res.json({ message: 'Execution started' })

    // Pass userId for rate limiting
    executeWorkflow(
      req.params.workflowId as string,
      req.user!.id,
      workflow.nodes,
      workflow.edges
    ).catch((error) => {
      console.error('Workflow execution failed:', error)
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
})

export default router
