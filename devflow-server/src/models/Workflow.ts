import mongoose, { Document, Schema } from 'mongoose'
import { IFlowNode, IFlowEdge } from '../types'

export interface IWorkflow extends Document {
  name: string
  workspace: string
  userId: mongoose.Types.ObjectId
  nodes: IFlowNode[]
  edges: IFlowEdge[]
  createdAt: Date
  updatedAt: Date
}

const WorkflowSchema = new Schema<IWorkflow>({
  name: { type: String, required: true, trim: true, default: 'Untitled Workflow' },
  workspace: { type: String, required: true, default: 'My Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  nodes: { type: Schema.Types.Mixed, default: [] },
  edges: { type: Schema.Types.Mixed, default: [] },
}, { timestamps: true })

// Index for fast user-specific queries
WorkflowSchema.index({ userId: 1, updatedAt: -1 })

export default mongoose.model<IWorkflow>('Workflow', WorkflowSchema)