import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  changePassword,
  disableAccount,
  deleteAccount,
} from '../controllers/userController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.put('/password', changePassword)
router.put('/disable', disableAccount)
router.delete('/account', deleteAccount)

export default router
