import mongoose, { Document, Schema } from 'mongoose'

export interface IWebhookTrigger extends Document {
  webhookId: string
  workflowId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  secret?: string
  active: boolean
  lastTriggeredAt?: Date
  triggerCount: number
  createdAt: Date
  updatedAt: Date
}

const WebhookTriggerSchema = new Schema<IWebhookTrigger>({
  webhookId: { type: String, required: true, unique: true },
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'Webhook Trigger' },
  secret: { type: String },
  active: { type: Boolean, default: true },
  lastTriggeredAt: { type: Date },
  triggerCount: { type: Number, default: 0 },
}, { timestamps: true })

WebhookTriggerSchema.index({ webhookId: 1 })
WebhookTriggerSchema.index({ workflowId: 1 })
WebhookTriggerSchema.index({ userId: 1 })

export default mongoose.model<IWebhookTrigger>('WebhookTrigger', WebhookTriggerSchema)