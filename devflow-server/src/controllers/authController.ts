import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

function signToken(id: string, email: string): string {
  return jwt.sign({ id, email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions)
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      res.status(400).json({ message: 'All fields are required' })
      return
    }

    const existing = await User.findOne({ email })
    if (existing) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }

    const user = await User.create({ email, password, name })
    const token = signToken(String(user._id), user.email)

    res.status(201).json({ token, user })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password required' })
      return
    }

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = signToken(String(user._id), user.email)
    res.json({ token, user })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById((req as any).user.id)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}