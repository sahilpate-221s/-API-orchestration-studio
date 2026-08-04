import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import Workflow from '../models/Workflow'
import Workspace from '../models/Workspace'
import Execution from '../models/Execution'
import UserTemplate from '../models/UserTemplate'

function signToken(id: string, email: string): string {
  return jwt.sign({ id, email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions)
}

// GET /user/profile — fetch current user profile
export async function getProfile(req: Request, res: Response): Promise<void> {
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

// PUT /user/profile — update name, email, avatarUrl
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id
    const { name, email, avatarUrl } = req.body

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    // Update name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ message: 'Name cannot be empty' })
        return
      }
      user.name = name.trim()
    }

    // Update email if provided
    if (email !== undefined) {
      const newEmail = email.trim().toLowerCase()
      if (!newEmail) {
        res.status(400).json({ message: 'Email cannot be empty' })
        return
      }
      if (newEmail !== user.email) {
        const existing = await User.findOne({ email: newEmail })
        if (existing) {
          res.status(409).json({ message: 'Email already in use' })
          return
        }
        user.email = newEmail
      }
    }

    // Update avatar if provided
    if (avatarUrl !== undefined) {
      // Validate size — cap at ~500KB for base64 data URIs
      if (typeof avatarUrl === 'string' && avatarUrl.length > 700000) {
        res.status(400).json({ message: 'Avatar image is too large (max ~500KB)' })
        return
      }
      user.avatarUrl = avatarUrl
    }

    await user.save()

    // If email was changed, issue a new token
    let token: string | undefined
    if (email !== undefined && email.trim().toLowerCase() !== (req as any).user.email) {
      token = signToken(String(user._id), user.email)
    }

    res.json({ user, ...(token ? { token } : {}) })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

// PUT /user/password — change password
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' })
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' })
      return
    }

    user.password = newPassword
    await user.save() // pre-save hook will hash it

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

// PUT /user/disable — disable account (soft deactivation)
export async function disableAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id
    const { password } = req.body

    if (!password) {
      res.status(400).json({ message: 'Password is required to disable your account' })
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({ message: 'Password is incorrect' })
      return
    }

    user.isDisabled = true
    await user.save()

    res.json({ message: 'Account has been disabled' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

// DELETE /user/account — permanently delete account and all data
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id
    const { password } = req.body

    if (!password) {
      res.status(400).json({ message: 'Password is required to delete your account' })
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({ message: 'Password is incorrect' })
      return
    }

    // Cascade delete all user data
    await Promise.all([
      Workflow.deleteMany({ userId }),
      Workspace.deleteMany({ userId }),
      Execution.deleteMany({ userId }),
      UserTemplate.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ])

    res.json({ message: 'Account and all associated data have been permanently deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}
