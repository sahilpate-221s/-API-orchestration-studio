import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { generateApiCall } from '../services/aiService'

const router = Router()

router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
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

export default router