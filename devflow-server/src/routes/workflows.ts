import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getWorkflows, getWorkflow,
  createWorkflow, updateWorkflow, deleteWorkflow,
  getWorkspaces, createWorkspace
} from '../controllers/workflowController'

const router = Router()

router.use(authMiddleware)
router.get('/workspaces', getWorkspaces)
router.post('/workspaces', createWorkspace)
router.get('/', getWorkflows)
router.get('/:id', getWorkflow)
router.post('/', createWorkflow)
router.put('/:id', updateWorkflow)
router.delete('/:id', deleteWorkflow)

export default router
