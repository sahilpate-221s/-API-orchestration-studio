import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { getTemplates, createTemplate, deleteTemplate } from '../controllers/templateController'

const router = Router()

router.use(authMiddleware)
router.get('/', getTemplates)
router.post('/', createTemplate)
router.delete('/:id', deleteTemplate)

export default router
