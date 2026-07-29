import { useCallback, useRef, useMemo, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { nodeTypes } from '../nodes/ApiNode'
import { useFlowStore } from '../../store/flowStore'
import type { HttpMethod } from '../../types/index'

export default function FlowCanvas() {
  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, setSelectedNode,
  } = useFlowStore()

  const memoNodeTypes = useMemo(() => nodeTypes, [])
  const [zoomLevel, setZoomLevel] = useState(100)

  // Keyboard shortcut listener for Zoom (+ / - / Ctrl+0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      if (e.key === '=' || e.key === '+' || (e.ctrlKey && (e.key === '=' || e.key === '+'))) {
        e.preventDefault()
        rfInstance.current?.zoomIn({ duration: 200 })
      } else if (e.key === '-' || e.key === '_' || (e.ctrlKey && (e.key === '-' || e.key === '_'))) {
        e.preventDefault()
        rfInstance.current?.zoomOut({ duration: 200 })
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        rfInstance.current?.fitView({ duration: 300, padding: 0.4 })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const method = e.dataTransfer.getData('application/reactflow-method') as HttpMethod
    if (!method || !rfInstance.current) return

    const position = rfInstance.current.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    })

    addNode(method, position)
  }, [addNode])

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  const handleMove = useCallback((_: any, viewport: { zoom: number }) => {
    setZoomLevel(Math.round(viewport.zoom * 100))
  }, [])

  return (
    <div
      className="devflow-canvas w-full h-full relative"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .devflow-canvas {
          background: #0B0C0E;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        .devflow-canvas-glow {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .devflow-canvas-glow::before,
        .devflow-canvas-glow::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
        }

        .devflow-canvas-glow::before {
          width: 46vw;
          max-width: 620px;
          height: 46vw;
          max-height: 620px;
          top: -16%;
          left: -10%;
          background: radial-gradient(circle, rgba(62,207,142,0.09) 0%, transparent 70%);
        }

        .devflow-canvas-glow::after {
          width: 38vw;
          max-width: 520px;
          height: 38vw;
          max-height: 520px;
          bottom: -14%;
          right: -8%;
          background: radial-gradient(circle, rgba(139,124,246,0.07) 0%, transparent 70%);
        }

        .devflow-canvas .react-flow {
          background: transparent;
        }

        .devflow-canvas .react-flow__renderer {
          position: relative;
          z-index: 1;
        }

        .devflow-canvas .react-flow__edge-path {
          stroke: rgba(255,255,255,0.16);
          stroke-width: 1.5;
          transition: stroke 0.15s ease;
        }

        .devflow-canvas .react-flow__edge:hover .react-flow__edge-path {
          stroke: rgba(62,207,142,0.55);
        }

        .devflow-canvas .react-flow__edge.selected .react-flow__edge-path {
          stroke: #3ECF8E;
          stroke-width: 2;
        }

        .devflow-canvas .react-flow__connection-path {
          stroke: #3ECF8E;
          stroke-width: 2;
        }

        .devflow-canvas .react-flow__edge-text {
          fill: #93959D;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
        }

        .devflow-canvas .react-flow__edge-textbg {
          fill: #131417;
        }

        .devflow-canvas .react-flow__handle {
          width: 8px;
          height: 8px;
          background: #3ECF8E;
          border: 2px solid #0B0C0E;
          border-radius: 50%;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .devflow-canvas .react-flow__handle:hover {
          background: #5BDA9F;
          transform: scale(1.25);
        }

        .devflow-canvas .react-flow__handle-connecting {
          background: #8B7CF6;
        }

        .devflow-canvas .react-flow__selection {
          background: rgba(62,207,142,0.08);
          border: 1px solid rgba(62,207,142,0.4);
        }

        .devflow-canvas .react-flow__node {
          transition: box-shadow 0.15s ease;
        }

        .devflow-canvas .react-flow__attribution {
          display: none;
        }

        .devflow-canvas .react-flow__controls {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 4px;
          background: rgba(19,20,23,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.45);
          overflow: hidden;
        }

        .devflow-canvas .react-flow__controls-button {
          width: 30px;
          height: 30px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #93959D;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .devflow-canvas .react-flow__controls-button svg {
          fill: currentColor;
          max-width: 13px;
          max-height: 13px;
        }

        .devflow-canvas .react-flow__controls-button:hover {
          background: rgba(255,255,255,0.07);
          color: #F2F3F5;
        }

        .devflow-canvas .react-flow__controls-button:disabled {
          opacity: 0.3;
        }

        .devflow-canvas .react-flow__controls-button + .react-flow__controls-button {
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .devflow-canvas .react-flow__minimap {
          background: #0E0F12 !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(62,207,142,0.3) !important;
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(62,207,142,0.12) !important;
          overflow: hidden;
        }

        .devflow-canvas .react-flow__minimap-mask {
          fill: rgba(11,12,14,0.72) !important;
          stroke: #3ECF8E !important;
          stroke-width: 1.5px !important;
        }

        .devflow-canvas .react-flow__minimap-node {
          fill: #1A1C23 !important;
          stroke: #3ECF8E !important;
          stroke-width: 2px !important;
          rx: 4px;
        }
      `}</style>

      <div className="devflow-canvas-glow" aria-hidden="true" />

      {/* Floating Zoom % Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center font-mono text-xs select-none pointer-events-auto">
        <div className="px-2.5 py-1.5 rounded-lg bg-[#0E0F12]/80 backdrop-blur-md border border-white/10 text-white font-bold shadow-lg">
          {zoomLevel}%
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => { rfInstance.current = instance }}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMove={handleMove}
        nodeTypes={memoNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 0.5 }}
        maxZoom={4}
        minZoom={0.1}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomActivationKeyPressed="Control"
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        panOnDrag={true}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.09)" />
        <Controls showInteractive={false} showFitView={true} className="!bottom-6 !left-6" />
        <MiniMap
          className="!bottom-6 !right-6"
          nodeColor={(n: any) => n.selected ? '#3ECF8E' : '#1A1C23'}
          nodeStrokeColor="#3ECF8E"
          nodeStrokeWidth={2}
          nodeBorderRadius={4}
          maskColor="rgba(11,12,14,0.72)"
          maskStrokeColor="#3ECF8E"
          maskStrokeWidth={1.5}
        />
      </ReactFlow>
    </div>
  )
}