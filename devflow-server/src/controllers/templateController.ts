import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import UserTemplate from '../models/UserTemplate'

export async function getTemplates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const templates = await UserTemplate.find({ userId: req.user!.id }).sort({ createdAt: -1 })
    res.json({ templates })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function createTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, nodes, edges } = req.body
    if (!name?.trim()) {
      res.status(400).json({ message: 'Template name is required' })
      return
    }
    const template = await UserTemplate.create({
      userId: req.user!.id,
      name: name.trim(),
      description: description?.trim() ?? '',
      nodes: nodes ?? [],
      edges: edges ?? [],
    })
    res.status(201).json({ template })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function deleteTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const template = await UserTemplate.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.id,
    })
    if (!template) {
      res.status(404).json({ message: 'Template not found' })
      return
    }
    res.json({ message: 'Template deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}
