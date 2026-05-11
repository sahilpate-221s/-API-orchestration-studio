import { useCallback, useRef, useMemo } from 'react'
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

  return (
    <div
      className="w-full h-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => { rfInstance.current = instance }}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={memoNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 0.5 }}
        maxZoom={4}
        minZoom={0.1}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f1f1f" />
        <Controls showInteractive={false} showFitView={false} className="!bottom-6 !left-6" />
        <MiniMap
          className="!bottom-6 !right-6"
          nodeColor="#1a1a1a"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  )
}