import mongoose from 'mongoose'

export async function connectDB(): Promise<void> {
  try {
    const uri = process.env.MONGODB_URI!
    await mongoose.connect(uri)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  }
}