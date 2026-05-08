import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import Workflow from '../models/Workflow'
import Workspace from '../models/Workspace'

const normalizeWorkspaceName = (name?: unknown): string =>
  typeof name === 'string' && name.trim() ? name.trim() : 'My Workspace'

export async function getWorkspaces(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workspaces = await Workspace.find({ userId: req.user!.id })
      .sort({ updatedAt: -1 })
    res.json({ workspaces })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function createWorkspace(req: AuthRequest, res: Response): Promise<void> {
  try {
    const name = normalizeWorkspaceName(req.body.name)
    const workspace = await Workspace.findOneAndUpdate(
      { userId: req.user!.id, name },
      { $setOnInsert: { userId: req.user!.id, name } },
      { new: true, upsert: true }
    )
    res.status(201).json({ workspace })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function getWorkflows(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workflows = await Workflow.find({ userId: req.user!.id })
      .sort({ updatedAt: -1 })
    res.json({ workflows })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function getWorkflow(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    })
    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found' })
      return
    }
    res.json({ workflow })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function createWorkflow(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, workspace, nodes, edges } = req.body
    const workspaceName = normalizeWorkspaceName(workspace)
    const workflow = await Workflow.create({
      name: name ?? 'Untitled Workflow',
      workspace: workspaceName,
      userId: req.user!.id,
      nodes: nodes ?? [],
      edges: edges ?? [],
    })
    await Workspace.findOneAndUpdate(
      { userId: req.user!.id, name: workspaceName },
      { $setOnInsert: { userId: req.user!.id, name: workspaceName } },
      { upsert: true }
    )
    res.status(201).json({ workflow })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function updateWorkflow(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, nodes, edges } = req.body
    const updateFields: Record<string, unknown> = {}
    if (typeof name === 'string') updateFields.name = name
    if (nodes !== undefined) updateFields.nodes = nodes
    if (edges !== undefined) updateFields.edges = edges

    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      updateFields,
      { new: true }
    )
    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found' })
      return
    }
    res.json({ workflow })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function deleteWorkflow(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.id,
    })
    if (!workflow) {
      res.status(404).json({ message: 'Workflow not found' })
      return
    }
    res.json({ message: 'Workflow deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}
