import { Router } from 'express'
import { register, login, getMe } from '../controllers/authController'
import { authMiddleware } from '../middleware/auth'
import { authRateLimit } from '../middleware/rateLimits'

const router = Router()

router.post('/register', authRateLimit, register)
router.post('/login', authRateLimit, login)
router.get('/me', authMiddleware, getMe)

export default router