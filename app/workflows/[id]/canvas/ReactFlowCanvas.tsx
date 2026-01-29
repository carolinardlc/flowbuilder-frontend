/**
 * Canvas basado en React Flow
 */

"use client";

import { useCallback } from "react";
import { ConnectionLineType, ConnectionMode } from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // CSS CRÍTICO para React Flow
import "./ReactFlowCanvas.css"; // CSS personalizado para handles visibles
import { useReactFlow } from "./hooks/useReactFlow";
import { nodeTypes } from "./components/ReactFlowNodes";
import NodeConfigPanel from "./NodeConfigPanel";
import type { CanvasProps } from "./types";
import type { WorkflowFlowNode } from "./types/reactFlow";

/**
 * Canvas moderno usando React Flow
 *
 * Este componente reemplaza al Canvas.tsx original con una implementación
 * mucho más robusta y profesional basada en React Flow.
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
    ReactFlow,
    Controls,
    Background,
    MiniMap,
  } = useReactFlow({ workflowId });

  // NODOS DE PRUEBA MANUALES - Compatible con WorkflowFlowNode
  const testNodes: WorkflowFlowNode[] = [
    {
      id: "test-1",
      type: "start", // Tipo que existe en nuestros nodeTypes
      position: { x: 100, y: 100 },
      data: {
        title: "Nodo de Prueba 1",
        workflowType: "START",
        config: {},
      },
    },
    {
      id: "test-2",
      type: "action", // Tipo que existe en nuestros nodeTypes
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

  // Verificar estructura de nodos
  nodes.forEach((node) => {
    console.log("🔍 Estructura completa del nodo:", {
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      // Verificar propiedades de React Flow
      draggable: node.draggable,
      selectable: node.selectable,
      deletable: node.deletable,
    });
  });

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
        height: "80vh", // Altura del viewport
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
        <h3
          style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "bold" }}
        >
          Arrastrar nodos
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {availableNodeTypes.map((nodeType) => (
            <div
              key={nodeType.type}
              style={{
                padding: "12px",
                backgroundColor: nodeType.color,
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "grab",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "all 0.2s ease",
              }}
              onMouseDown={(e: any) => onDragStart(e, nodeType.type)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>
                {nodeType.icon}
              </div>
              <div>{nodeType.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "30px", fontSize: "12px", color: "#64748b" }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
            Instrucciones:
          </h4>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.5" }}>
            <li>Arrastra nodos al canvas</li>
            <li>Click en nodos para configurar</li>
            <li>Conecta nodos arrastrando</li>
            <li>Usa la rueda del mouse para zoom</li>
            <li>Presiona Delete para eliminar nodo</li>
          </ul>
        </div>
      </aside>

      {/* Canvas principal con React Flow */}
      <main style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            right: "20px",
            zIndex: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
              Workflow {workflowId}
            </h1>
            <p
              style={{
                margin: "5px 0 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Canvas con React Flow
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

        <ReactFlow
          nodes={testNodes} // USAR NODOS DE PRUEBA
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

            // Verificar si los nodos tienen el tipo correcto
            nodes.forEach((node) => {
              console.log(
                `🔍 Nodo ${node.id}: tipo=${node.type}, tieneComponente=${!!nodeTypes[node.type as keyof typeof nodeTypes]}`,
              );
            });
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes} // REACTIVADO - USAR NUESTROS COMPONENTES
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
          connectionMode={ConnectionMode.Loose} // Permitir más flexibilidad en conexiones
        >
        nodes={testNodes} // USAR NODOS DE PRUEBA
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

          // Verificar si los nodos tienen el tipo correcto
          nodes.forEach((node) => {
            console.log(
              `🔍 Nodo ${node.id}: tipo=${node.type}, tieneComponente=${!!nodeTypes[node.type as keyof typeof nodeTypes]}`,
            );
          });
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes} // REACTIVADO - USAR NUESTROS COMPONENTES
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
        connectionMode={ConnectionMode.Loose} // Permitir más flexibilidad en conexiones
      >
        <Background
          color="#e2e8f0"
          gap={15}
          size={1}
          variant="dots"
        />
        <Controls
          position="bottom-right"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        <MiniMap
          position="bottom-left"
          nodeColor={(node) => {
            const colors = {
              start: '#62c9a9',
              action: '#f5b6a5',
              conditional: '#9e8bff',
              end: '#94a3b8',
            };
            return colors[node.type as keyof typeof colors] || '#94a3b8';
          }}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          zoomable
          pannable
        />
      </ReactFlow>
    </main>

    {/* Panel de configuración */}
    <NodeConfigPanel
      node={
        selectedNode
          ? {
              id: selectedNode.id,
              title: selectedNode.data.title,
              type: selectedNode.data.workflowType,
              x: selectedNode.position.x,
              y: selectedNode.position.y,
              config: selectedNode.data.config || {},
            }
          : null
      }
      isOpen={isConfigPanelOpen}
      onClose={closeConfigPanel}
      onSave={saveNodeConfig}
    />
  </div>
);
        node={
          selectedNode
            ? {
                id: selectedNode.id,
                title: selectedNode.data.title,
                type: selectedNode.data.workflowType,
                x: selectedNode.position.x,
                y: selectedNode.position.y,
                config: selectedNode.data.config || {},
              }
            : null
        }
        isOpen={isConfigPanelOpen}
        onClose={closeConfigPanel}
        onSave={saveNodeConfig}
      />
    </div>
  );
}
