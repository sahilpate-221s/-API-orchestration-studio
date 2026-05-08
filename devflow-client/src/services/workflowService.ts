import api from './api'
import type { FlowNode, FlowEdge } from '../types'

export async function fetchWorkflows() {
  const res = await api.get('/workflows')
  return res.data.workflows
}

export async function fetchWorkflow(id: string) {
  const res = await api.get(`/workflows/${id}`)
  return res.data.workflow
}

export async function createWorkflow(name: string, workspace: string, nodes: FlowNode[], edges: FlowEdge[]) {
  const res = await api.post('/workflows', { name, workspace, nodes, edges })
  return res.data.workflow
}

export async function saveWorkflow(id: string, name: string, nodes: FlowNode[], edges: FlowEdge[]) {
  const res = await api.put(`/workflows/${id}`, { name, nodes, edges })
  return res.data.workflow
}

export async function deleteWorkflow(id: string) {
  const res = await api.delete(`/workflows/${id}`)
  return res.data
}