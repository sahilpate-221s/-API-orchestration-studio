import { Response } from 'express'
import mongoose from 'mongoose'
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

const paramId = (id: string | string[] | undefined): string =>
  Array.isArray(id) ? (id[0] ?? '') : (id ?? '')

export async function updateWorkspace(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workspaceId = paramId(req.params.workspaceId)
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      res.status(400).json({ message: 'Invalid workspace id' })
      return
    }
    const newName = normalizeWorkspaceName(req.body?.name)
    const ws = await Workspace.findOne({ _id: workspaceId, userId: req.user!.id })
    if (!ws) {
      res.status(404).json({ message: 'Workspace not found' })
      return
    }
    if (ws.name === newName) {
      res.json({ workspace: ws })
      return
    }
    const clash = await Workspace.findOne({
      userId: req.user!.id,
      name: newName,
      _id: { $ne: ws._id },
    })
    if (clash) {
      res.status(409).json({ message: 'A workspace with that name already exists' })
      return
    }
    const oldName = ws.name
    ws.name = newName
    await ws.save()
    await Workflow.updateMany(
      { userId: req.user!.id, workspace: oldName },
      { $set: { workspace: newName } }
    )
    res.json({ workspace: ws })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err })
  }
}

export async function deleteWorkspace(req: AuthRequest, res: Response): Promise<void> {
  try {
    const workspaceId = paramId(req.params.workspaceId)
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      res.status(400).json({ message: 'Invalid workspace id' })
      return
    }
    const ws = await Workspace.findOne({ _id: workspaceId, userId: req.user!.id })
    if (!ws) {
      res.status(404).json({ message: 'Workspace not found' })
      return
    }
    if (ws.name === 'My Workspace') {
      res.status(400).json({ message: 'The default workspace cannot be deleted' })
      return
    }
    const defaultName = 'My Workspace'
    await Workflow.updateMany(
      { userId: req.user!.id, workspace: ws.name },
      { $set: { workspace: defaultName } }
    )
    await Workspace.findOneAndUpdate(
      { userId: req.user!.id, name: defaultName },
      { $setOnInsert: { userId: req.user!.id, name: defaultName } },
      { upsert: true }
    )
    await Workspace.findByIdAndDelete(ws._id)
    res.json({ message: 'Workspace deleted', migratedTo: defaultName })
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
