import mongoose, { Document, Schema } from 'mongoose'

export type NodeExecutionResult = {
  nodeId: string
  nodeLabel: string
  status: 'success' | 'error' | 'skipped'
  response?: unknown
  error?: string
  executionTime: number
  fromCache: boolean
  retryCount: number
  startedAt: Date
  completedAt: Date
}

export interface IExecution extends Document {
  executionId: string
  workflowId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  status: 'queued' | 'running' | 'success' | 'error' | 'cancelled'
  nodes: NodeExecutionResult[]
  totalTime: number
  triggeredAt: Date
  completedAt?: Date
  error?: string
  idempotencyKey: string
  jobId?: string
}

const NodeResultSchema = new Schema<NodeExecutionResult>({
  nodeId: String,
  nodeLabel: String,
  status: { type: String, enum: ['success', 'error', 'skipped'] },
  response: Schema.Types.Mixed,
  error: String,
  executionTime: Number,
  fromCache: Boolean,
  retryCount: { type: Number, default: 0 },
  startedAt: Date,
  completedAt: Date,
}, { _id: false })

const ExecutionSchema = new Schema<IExecution>({
  executionId: { type: String, required: true, unique: true },
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'success', 'error', 'cancelled'],
    default: 'queued',
  },
  nodes: [NodeResultSchema],
  totalTime: { type: Number, default: 0 },
  triggeredAt: { type: Date, default: Date.now },
  completedAt: Date,
  error: String,
  idempotencyKey: { type: String, required: true },
  jobId: String,
}, { timestamps: true })

ExecutionSchema.index({ workflowId: 1, triggeredAt: -1 })
ExecutionSchema.index({ userId: 1, triggeredAt: -1 })
ExecutionSchema.index({ idempotencyKey: 1 }, { unique: true })

export default mongoose.model<IExecution>('Execution', ExecutionSchema)