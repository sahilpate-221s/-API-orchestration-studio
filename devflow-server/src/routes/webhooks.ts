import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'
import WebhookTrigger from '../models/WebhookTrigger'
import Workflow from '../models/Workflow'
import { workflowQueue } from '../config/queue'
import Execution from '../models/Execution'

const router = Router()

// ── Authenticated routes ──────────────────────────────────────────────────────

// Get all webhooks for a workflow
router.get(
  '/workflow/:workflowId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const webhooks = await WebhookTrigger.find({
        workflowId: req.params.workflowId,
        userId: req.user!.id,
      }).sort({ createdAt: -1 })
      res.json({ webhooks })
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err })
    }
  }
)

// Create webhook for a workflow
router.post(
  '/workflow/:workflowId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const workflow = await Workflow.findOne({
        _id: req.params.workflowId,
        userId: req.user!.id,
      })
      if (!workflow) {
        res.status(404).json({ message: 'Workflow not found' })
        return
      }

      const webhookId = uuidv4().replace(/-/g, '').slice(0, 24)

      const webhook = await WebhookTrigger.create({
        webhookId,
        workflowId: workflow._id,
        userId: req.user!.id,
        name: req.body.name ?? `${workflow.name} Trigger`,
        secret: req.body.secret,
        active: true,
      })

      res.status(201).json({ webhook })
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err })
    }
  }
)

// Delete webhook
router.delete(
  '/:webhookId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await WebhookTrigger.findOneAndDelete({
        webhookId: req.params.webhookId,
        userId: req.user!.id,
      })
      if (!webhook) {
        res.status(404).json({ message: 'Webhook not found' })
        return
      }
      res.json({ message: 'Webhook deleted' })
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err })
    }
  }
)

// Toggle webhook active/inactive
router.patch(
  '/:webhookId/toggle',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await WebhookTrigger.findOne({
        webhookId: req.params.webhookId,
        userId: req.user!.id,
      })
      if (!webhook) {
        res.status(404).json({ message: 'Webhook not found' })
        return
      }
      webhook.active = !webhook.active
      await webhook.save()
      res.json({ webhook })
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err })
    }
  }
)

// Regenerate webhook ID
router.post(
  '/:webhookId/regenerate',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await WebhookTrigger.findOne({
        webhookId: req.params.webhookId,
        userId: req.user!.id,
      })
      if (!webhook) {
        res.status(404).json({ message: 'Webhook not found' })
        return
      }
      webhook.webhookId = uuidv4().replace(/-/g, '').slice(0, 24)
      await webhook.save()
      res.json({ webhook })
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err })
    }
  }
)

// ── Public trigger endpoint ───────────────────────────────────────────────────
// This is called by external services (GitHub, Stripe, etc.)

router.all(
  '/trigger/:webhookId',
  async (req: Request, res: Response) => {
    try {
      const webhook = await WebhookTrigger.findOne({
        webhookId: req.params.webhookId,
        active: true,
      })

      if (!webhook) {
        res.status(404).json({ message: 'Webhook not found or inactive' })
        return
      }

      // Load the workflow
      const workflow = await Workflow.findById(webhook.workflowId)
      if (!workflow) {
        res.status(404).json({ message: 'Workflow not found' })
        return
      }

      // Build webhook payload — available to all nodes
      const webhookPayload = {
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
        timestamp: new Date().toISOString(),
        webhookId: req.params.webhookId,
      }

      const executionId = uuidv4()
      const idempotencyKey = `webhook-${req.params.webhookId}-${Date.now()}`

      // Save execution record
      await Execution.create({
        executionId,
        workflowId: workflow._id,
        userId: webhook.userId,
        status: 'queued',
        nodes: [],
        totalTime: 0,
        idempotencyKey,
        triggeredBy: 'webhook',
      })

      // Enqueue job with webhook payload as initial context
      await workflowQueue.add(
        'run-workflow',
        {
          workflowId: String(workflow._id),
          userId: String(webhook.userId),
          nodes: workflow.nodes,
          edges: workflow.edges,
          executionId,
          idempotencyKey,
          webhookPayload,
        },
        { jobId: executionId }
      )

      // Update webhook stats
      await WebhookTrigger.findByIdAndUpdate(webhook._id, {
        $inc: { triggerCount: 1 },
        lastTriggeredAt: new Date(),
      })

      // Respond immediately
      res.json({
        message: 'Workflow triggered',
        executionId,
        workflowId: String(workflow._id),
      })

    } catch (err) {
      console.error('Webhook trigger error:', err)
      res.status(500).json({ message: 'Trigger failed', error: err })
    }
  }
)

export default router