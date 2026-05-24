import mongoose, { Document, Schema } from 'mongoose'

export interface IUserTemplate extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  description: string
  nodes: unknown[]
  edges: unknown[]
  createdAt: Date
  updatedAt: Date
}

const UserTemplateSchema = new Schema<IUserTemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export default mongoose.model<IUserTemplate>('UserTemplate', UserTemplateSchema)
