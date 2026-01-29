/**
 * Canvas basado en React Flow - Versión Limpia y Funcional
 */

"use client";

import { useCallback } from "react";
import {
  ConnectionLineType,
  ConnectionMode,
  ReactFlow,
  Controls,
  Background,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // CSS CRÍTICO para React Flow
import "./ReactFlowCanvas.css"; // CSS personalizado para handles visibles
import { useReactFlow } from "./hooks/useReactFlow";
import { nodeTypes } from "./components/ReactFlowNodes";
import NodeConfigPanel from "./NodeConfigPanel";
import type { CanvasProps } from "./types";
import type { WorkflowFlowNode } from "./types/reactFlow";

/**
 * Canvas moderno usando React Flow
 */
export default function ReactFlowCanvas({ workflowId, actions }: CanvasProps) {
  console.log("🔥🔥🔥 ReactFlowCanvas se está renderizando!!! 🔥🔥🔥");

  const {
    nodes,
    edges,
    selectedNode,
    isConfigPanelOpen,
    availableNodeTypes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    addNode,
    deleteNode,
    saveNodeConfig,
    closeConfigPanel,
  } = useReactFlow({ workflowId });

  // NODOS DE PRUEBA MANUALES - Compatible con WorkflowFlowNode
  const testNodes: WorkflowFlowNode[] = [
    {
      id: "test-1",
      type: "start",
      position: { x: 100, y: 100 },
      data: {
        title: "Nodo de Prueba 1",
        workflowType: "START",
        config: {},
      },
    },
    {
      id: "test-2",
      type: "action",
      position: { x: 300, y: 100 },
      data: {
        title: "Nodo de Prueba 2",
        workflowType: "ACTION",
        config: {},
      },
    },
  ];

  console.log("🎯 Nodos actuales:", nodes);
  console.log("🔗 Edges actuales:", edges);
  console.log("🏷️ NodeTypes disponibles:", nodeTypes);
  console.log("🧪 Nodos de prueba:", testNodes);

  /**
   * Manejar drag & drop desde la paleta
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      console.log("🎯 Drop event triggered");

      const type = event.dataTransfer.getData("application/reactflow") as
        | "start"
        | "action"
        | "conditional"
        | "end";

      console.log("📋 Data from drag:", {
        type,
        dataTransfer: event.dataTransfer.getData("application/reactflow"),
      });

      if (typeof type === "undefined" || !type) {
        console.warn("❌ No type found in drag data");
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      console.log("📍 Calculated position:", position);
      addNode(type, position);
    },
    [addNode],
  );

  /**
   * Iniciar drag desde la paleta
   */
  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string) => {
      console.log("🚀 Iniciando drag para:", nodeType);
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";
      console.log("✅ Data set:", nodeType);
    },
    [],
  );

  /**
   * Manejar teclas para eliminar nodos
   */
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Delete" && selectedNode) {
        deleteNode(selectedNode.id);
      }
    },
    [selectedNode, deleteNode],
  );

  // Agregar listener para teclado
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onKeyDown);
  }

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
      }}
    >
      {/* Panel izquierdo - Paleta de nodos */}
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
                backgroundColor: nodeType.bgColor,
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

      {/* Área principal del canvas */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header del canvas */}
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
              Canvas con React Flow
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Arrastra nodos desde la paleta para comenzar
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

        {/* React Flow Canvas */}
        <div style={{ flex: 1, position: "relative" }}>
          <ReactFlow
            nodes={nodes.length > 0 ? nodes : testNodes} // USAR NODOS REALES O DE PRUEBA
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onInit={() => {
              console.log("🚀 React Flow inicializado");
              console.log("📋 Nodos iniciales:", nodes);
              console.log("🔗 Edges iniciales:", edges);
              console.log("🏷️ NodeTypes disponibles:", Object.keys(nodeTypes));
              console.log("🎨 Componentes nodeTypes:", nodeTypes);

              nodes.forEach((node) => {
                console.log(
                  `🔍 Nodo ${node.id}: tipo=${node.type}, tieneComponente=${!!nodeTypes[node.type as keyof typeof nodeTypes]}`,
                );
              });
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
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
        />
      )}
    </div>
  );
}
