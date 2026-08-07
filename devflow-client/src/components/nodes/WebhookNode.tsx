import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { useFlowStore } from '../../store/flowStore'

export type WebhookNodeData = {
  label: string
  webhookId?: string
  webhookUrl?: string
  active: boolean
  triggerCount?: number
  lastTriggeredAt?: string
  status: 'idle' | 'running' | 'success' | 'error'
}

export default function WebhookNode({ id, data, selected }: NodeProps<WebhookNodeData>) {
  const { webhookId, webhookUrl, active, triggerCount, label, status } = data
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { onNodesChange } = useFlowStore()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNodesChange([{ type: 'remove', id }])
  }

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusDot: Record<string, string> = {
    idle: '#3f3f46',
    running: '#60a5fa',
    success: '#34d399',
    error: '#f87171',
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '180px',
        background: '#111111',
        border: `1px solid ${selected || isHovered ? 'rgba(251,113,133,0.5)' : 'rgba(251,113,133,0.2)'}`,
        borderRadius: '16px',
        boxShadow: selected || isHovered
          ? '0 0 20px rgba(251,113,133,0.12), 0 8px 24px rgba(0,0,0,0.5)'
          : '0 4px 15px rgba(0,0,0,0.4)',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Delete button */}
      {isHovered && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute', top: '8px', right: '8px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#E24B4A', border: '2px solid #111111',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', zIndex: 10, padding: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(251,113,133,0.04)',
      }}>
        {/* Lightning icon */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'rgba(251,113,133,0.12)',
          border: '1px solid rgba(251,113,133,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fb7185', letterSpacing: '0.04em' }}>
            WEBHOOK TRIGGER
          </div>
          <div style={{
            fontSize: '12px', fontWeight: 500,
            color: 'rgba(255,255,255,0.8)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {label || 'Webhook Trigger'}
          </div>
        </div>

        {/* Active/status indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 7px', borderRadius: '100px',
          background: active ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${active ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)'}`,
          flexShrink: 0,
        }}>
          <div style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: active ? '#34d399' : '#3f3f46',
            boxShadow: active ? '0 0 6px #34d399' : 'none',
          }} />
          <span style={{ fontSize: '9px', fontWeight: 700, color: active ? '#34d399' : '#71717a' }}>
            {active ? 'ACTIVE' : 'OFF'}
          </span>
        </div>
      </div>

      {/* URL section */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>
          Trigger URL
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px', padding: '6px 8px',
        }}>
          <span style={{
            flex: 1, fontSize: '9px', fontFamily: 'monospace',
            color: webhookId ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {webhookId ? `...trigger/${webhookId}` : 'Click node to configure'}
          </span>
          {webhookId && (
            <button
              onClick={copyUrl}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px', borderRadius: '4px', flexShrink: 0,
                color: copied ? '#34d399' : 'rgba(255,255,255,0.3)',
                transition: 'color 0.15s',
              }}
            >
              {copied ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {triggerCount !== undefined && triggerCount > 0 && (
        <div style={{
          padding: '0 14px 10px',
          display: 'flex', gap: '12px',
        }}>
          <div>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Triggered
            </span>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
              {triggerCount}×
            </div>
          </div>
        </div>
      )}

      {/* Info when not configured */}
      {!webhookId && (
        <div style={{
          margin: '0 14px 12px',
          padding: '8px 10px',
          background: 'rgba(251,113,133,0.05)',
          border: '1px solid rgba(251,113,133,0.12)',
          borderRadius: '8px',
        }}>
          <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
            Click this node to generate a webhook URL. External services can then trigger this workflow automatically.
          </p>
        </div>
      )}

      {/* Status dot */}
      <div style={{
        position: 'absolute', bottom: '10px', right: '12px',
        width: '5px', height: '5px', borderRadius: '50%',
        background: statusDot[status] ?? statusDot.idle,
        boxShadow: status === 'running' ? `0 0 8px ${statusDot.running}` : 'none',
      }} />

      {/* Source handle only — webhook is always the start */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '10px', height: '10px',
          background: '#0a0a0a',
          border: '2px solid #fb7185',
          borderRadius: '50%',
          boxShadow: '0 0 8px rgba(251,113,133,0.4)',
        }}
      />
    </div>
  )
}

export const webhookNodeTypes = { webhookNode: WebhookNode }