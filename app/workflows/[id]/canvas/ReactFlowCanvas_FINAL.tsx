/**
 * React Flow Canvas - Versión Final Limpia y Estable
 * Sin renderizado infinito, con estructura simple y directa
 */

"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import "./ReactFlowCanvas.css";
import { nodeTypes } from "./components/ReactFlowNodes";
import NodeConfigPanel from "./NodeConfigPanel";
import type { CanvasProps } from "./types";
import type { WorkflowFlowNode } from "./types/reactFlow";

/**
 * Canvas React Flow - Versión Simplificada
 */
export default function ReactFlowCanvas({ workflowId, actions }: CanvasProps) {
  console.log("🚀 ReactFlowCanvas_FINAL renderizado");

  // Estado directo con hooks de React Flow - Canvas empieza VACÍO
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowFlowNode>([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Estado para panel de configuración
  const [selectedNode, setSelectedNode] = useState<WorkflowFlowNode | null>(
    null,
  );
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Manejar conexiones
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      console.log("🔗 Nueva conexión:", params);
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  // Manejar click en nodos
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("🖱️ Click en nodo:", node);
    setSelectedNode(node as WorkflowFlowNode);
    setIsConfigPanelOpen(true);
  }, []);

  // Cerrar panel de configuración
  const closeConfigPanel = useCallback(() => {
    setIsConfigPanelOpen(false);
    setSelectedNode(null);
  }, []);

  // Guardar configuración
  const saveNodeConfig = useCallback(
    (config: any) => {
      if (selectedNode) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNode.id
              ? { ...node, data: { ...node.data, ...config } }
              : node,
          ),
        );
      }
      closeConfigPanel();
    },
    [selectedNode, setNodes, closeConfigPanel],
  );

  // Eliminar nodo
  const deleteNode = useCallback(
    (nodeId: string) => {
      // Eliminar el nodo
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));

      // Eliminar todas las conexiones del nodo
      setEdges((eds) =>
        eds.filter(
          (edge: any) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      );

      console.log(`🗑️ Nodo ${nodeId} y sus conexiones eliminados`);
    },
    [setNodes, setEdges],
  );

  // Drag & Drop desde paleta
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as
        | "start"
        | "action"
        | "conditional"
        | "end";

      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: WorkflowFlowNode = {
        id: `${type}-${Math.random().toString(36).substr(2, 9)}`, // ID único sin Date.now()
        type,
        position,
        data: {
          title: `Nuevo ${type}`,
          workflowType: type.toUpperCase() as any,
          config: {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  // Nodos disponibles para paleta
  const availableNodeTypes = [
    { type: "start", label: "Inicio", icon: "🚀", color: "#62c9a9" },
    { type: "action", label: "Acción", icon: "⚡", color: "#f5b6a5" },
    { type: "conditional", label: "Condicional", icon: "🔀", color: "#9e8bff" },
    { type: "end", label: "Fin", icon: "🏁", color: "#94a3b8" },
  ];

  // Iniciar drag desde paleta
  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  return (
    <div
      className="canvas-container"
      style={{
        width: "100%",
        height: "80vh",
        border: "2px solid #e2e8f0",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#f8fafc",
        display: "flex",
      }}
    >
      {/* Panel izquierdo - Paleta */}
      <aside
        style={{
          width: "250px",
          padding: "20px",
          backgroundColor: "#f8fafc",
          borderRight: "1px solid #e2e8f0",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginBottom: "16px", color: "#1e293b" }}>
          🎨 Paleta de Nodos
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {availableNodeTypes.map((nodeType) => (
            <div
              key={nodeType.type}
              draggable
              onDragStart={(event) => onDragStart(event, nodeType.type)}
              style={{
                padding: "12px",
                backgroundColor: nodeType.color + "20",
                border: `2px solid ${nodeType.color}`,
                borderRadius: "8px",
                cursor: "grab",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>
                {nodeType.icon}
              </div>
              <div style={{ fontWeight: "bold", color: "#1e293b" }}>
                {nodeType.label}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Canvas principal */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>
              React Flow Canvas
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Arrastra nodos para construir tu workflow
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {actions}
            <span
              style={{
                padding: "6px 12px",
                backgroundColor: "#f1f5f9",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              {nodes.length} nodos, {edges.length} conexiones
            </span>
          </div>
        </div>

        {/* React Flow */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
            connectionLineStyle={{ stroke: "#9333ea", strokeWidth: 3 }}
            connectionLineType={ConnectionLineType.SmoothStep}
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            minZoom={0.3}
            maxZoom={2}
            connectionMode={ConnectionMode.Loose}
          >
            <Background color="#e2e8f0" gap={15} size={1} />
            <Controls
              position="bottom-right"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <MiniMap
              position="bottom-left"
              nodeColor={(node) => {
                const colors = {
                  start: "#62c9a9",
                  action: "#f5b6a5",
                  conditional: "#9e8bff",
                  end: "#94a3b8",
                };
                return colors[node.type as keyof typeof colors] || "#94a3b8";
              }}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>
      </main>

      {/* Panel de configuración */}
      {isConfigPanelOpen && selectedNode && (
        <NodeConfigPanel
          node={{
            id: selectedNode.id,
            title: selectedNode.data.title,
            type: selectedNode.data.workflowType,
            x: selectedNode.position.x,
            y: selectedNode.position.y,
            config: selectedNode.data.config || {},
          }}
          isOpen={isConfigPanelOpen}
          onClose={closeConfigPanel}
          onSave={saveNodeConfig}
          onDelete={deleteNode} // Agregamos la función de eliminar
        />
      )}
    </div>
  );
}
