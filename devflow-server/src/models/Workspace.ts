import mongoose, { Document, Schema } from 'mongoose'

export interface IWorkspace extends Document {
  name: string
  userId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

WorkspaceSchema.index({ userId: 1, name: 1 }, { unique: true })
WorkspaceSchema.index({ userId: 1, updatedAt: -1 })

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)
