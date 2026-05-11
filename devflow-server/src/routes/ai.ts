import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { generateApiCall, fixApiCall } from '../services/aiService'
import { aiRateLimit } from '../middleware/rateLimits'

const router = Router()

router.post('/generate', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { description } = req.body
    if (!description) {
      res.status(400).json({ message: 'Description is required' })
      return
    }
    const config = await generateApiCall(description)
    res.json({ config })
  } catch (err) {
    res.status(500).json({ message: 'AI generation failed', error: err })
  }
})

router.post('/fix', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { error, config } = req.body
    if (!error || !config) {
      res.status(400).json({ message: 'Error and config are required' })
      return
    }
    const fixedConfig = await fixApiCall(error, config)
    res.json({ config: fixedConfig })
  } catch (err) {
    res.status(500).json({ message: 'AI fixing failed', error: err })
  }
})

export default router