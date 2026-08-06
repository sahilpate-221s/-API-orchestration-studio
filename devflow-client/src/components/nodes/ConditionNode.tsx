import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { ConditionData } from '../../types'
import { useFlowStore } from '../../store/flowStore'

const statusColors: Record<string, string> = {
  idle: '#3f3f46',
  running: '#60a5fa',
  success: '#34d399',
  error: '#f87171',
}

export default function ConditionNode({ id, data, selected }: NodeProps<ConditionData>) {
  const { label, sourcePath, operator, compareValue, status, trueLabel, falseLabel, conditionResult, conditionLabel } = data
  const [isHovered, setIsHovered] = useState(false)
  const { onNodesChange } = useFlowStore()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNodesChange([{ type: 'remove', id }])
  }

  const operatorLabel: Record<string, string> = {
    eq: '==', neq: '!=',
    gt: '>', gte: '>=',
    lt: '<', lte: '<=',
    contains: 'contains',
    not_contains: '!contains',
    exists: 'exists',
    not_exists: '!exists',
  }

  const dotColor = statusColors[status] ?? statusColors.idle
  const hasResult = status === 'success' && conditionResult !== undefined
  const resultColor = conditionResult ? '#34d399' : '#f87171'

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Delete button */}
      {isHovered && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#E24B4A',
            border: '2px solid #111111',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#E24B4A' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Diamond shape */}
      <div style={{
        width: '130px',
        height: '130px',
        background: '#111111',
        border: `2px solid ${hasResult ? resultColor : (selected || isHovered ? 'rgba(251,191,36,0.6)' : 'rgba(251,191,36,0.25)')}`,
        transform: 'rotate(45deg)',
        borderRadius: '8px',
        boxShadow: hasResult
          ? `0 0 24px ${conditionResult ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}, 0 8px 24px rgba(0,0,0,0.5)`
          : (selected || isHovered
            ? '0 0 20px rgba(251,191,36,0.15), 0 8px 24px rgba(0,0,0,0.5)'
            : '0 4px 15px rgba(0,0,0,0.4)'),
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }} />

      {/* Content inside diamond (counter-rotated) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '24px',
        pointerEvents: 'none',
      }}>
        {/* IF label or result badge */}
        {hasResult ? (
          <div style={{
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: conditionResult ? '#34d399' : '#f87171',
            background: conditionResult ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
            border: `1px solid ${conditionResult ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
            borderRadius: '4px',
            padding: '1px 6px',
            lineHeight: 1.4,
          }}>
            {conditionLabel || (conditionResult ? 'YES' : 'NO')}
          </div>
        ) : (
          <div style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#fbbf24',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            IF
          </div>
        )}

        {/* Label */}
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '90px',
        }}>
          {label || 'Condition'}
        </div>

        {/* Condition expression */}
        <div style={{
          fontSize: '8px',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '90px',
        }}>
          {sourcePath || '$.field'} {operatorLabel[operator] || '=='} {operator === 'exists' || operator === 'not_exists' ? '' : (compareValue || '?')}
        </div>

        {/* Status dot */}
        <div style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: dotColor,
          boxShadow: status === 'running' ? `0 0 8px ${dotColor}` : 'none',
          animation: status === 'running' ? 'pulse 2s infinite' : 'none',
          marginTop: '2px',
        }} />
      </div>

      {/* Input handle — top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          background: '#0a0a0a',
          border: '2px solid #fbbf24',
          borderRadius: '50%',
          top: '8px',
          boxShadow: '0 0 8px rgba(251,191,36,0.3)',
        }}
      />

      {/* YES handle — right (true branch) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{
          width: '10px',
          height: '10px',
          background: '#0a0a0a',
          border: '2px solid #34d399',
          borderRadius: '50%',
          right: '6px',
          boxShadow: '0 0 8px rgba(52,211,153,0.4)',
        }}
      />

      {/* NO handle — left (false branch) */}
      <Handle
        type="source"
        position={Position.Left}
        id="false"
        style={{
          width: '10px',
          height: '10px',
          background: '#0a0a0a',
          border: '2px solid #f87171',
          borderRadius: '50%',
          left: '6px',
          boxShadow: '0 0 8px rgba(248,113,113,0.4)',
        }}
      />

      {/* YES / NO labels outside diamond */}
      <div style={{
        position: 'absolute',
        right: '-28px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '9px',
        fontWeight: 800,
        color: '#34d399',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
      }}>
        {trueLabel || 'YES'}
      </div>
      <div style={{
        position: 'absolute',
        left: '-24px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '9px',
        fontWeight: 800,
        color: '#f87171',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
      }}>
        {falseLabel || 'NO'}
      </div>
    </div>
  )
}

export const conditionNodeTypes = { conditionNode: ConditionNode }