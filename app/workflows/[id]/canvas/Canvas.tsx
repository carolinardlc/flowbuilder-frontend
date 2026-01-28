"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useCallback, useRef } from "react";
import WorkflowConnection from "./WorkflowConnection";
import WorkflowNode, {
  type WorkflowNodeData,
  type WorkflowNodeType,
} from "./WorkflowNode";

type CanvasProps = {
  workflowId: string;
  actions?: ReactNode;
};

type Connection = {
  id: string;
  from: string;
  to: string;
};

type DragState = {
  isDragging: boolean;
  draggedNode: string | null;
  dragOffset: { x: number; y: number };
  newNodeType: WorkflowNodeType | null;
  isConnecting: boolean;
  connectionStart: string | null;
  tempConnection: { x: number; y: number } | null;
};

export default function Canvas({ workflowId, actions }: CanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("start");
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([
    { id: "start", title: "Inicio", type: "START", x: 120, y: 140 },
    {
      id: "action-1",
      title: "Recolectar datos",
      type: "ACTION",
      x: 420,
      y: 140,
    },
    {
      id: "conditional-1",
      title: "Validar criterios",
      type: "CONDITIONAL",
      x: 740,
      y: 140,
    },
    { id: "action-2", title: "Enviar correo", type: "ACTION", x: 1020, y: 40 },
    { id: "end-1", title: "Finalizar", type: "END", x: 1320, y: 40 },
    { id: "end-2", title: "Cerrar flujo", type: "END", x: 1020, y: 260 },
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: "c1", from: "start", to: "action-1" },
    { id: "c2", from: "action-1", to: "conditional-1" },
    { id: "c3", from: "conditional-1", to: "action-2" },
    { id: "c4", from: "action-2", to: "end-1" },
    { id: "c5", from: "conditional-1", to: "end-2" },
  ]);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
    newNodeType: null,
    isConnecting: false,
    connectionStart: null,
    tempConnection: null,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeIdCounter = useRef(6);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  // Funciones para drag and drop
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const rect = e.currentTarget.getBoundingClientRect();
      setDragState({
        isDragging: true,
        draggedNode: nodeId,
        dragOffset: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
        newNodeType: null,
        isConnecting: false,
        connectionStart: null,
        tempConnection: null,
      });
      setSelectedNodeId(nodeId);
    },
    [nodes],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      if (dragState.draggedNode) {
        // Mover nodo existente
        const newX = x - dragState.dragOffset.x;
        const newY = y - dragState.dragOffset.y;
        setNodes((prev) =>
          prev.map((node) =>
            node.id === dragState.draggedNode
              ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
              : node,
          ),
        );
      } else if (dragState.newNodeType) {
        // Previsualizar nuevo nodo
      } else if (dragState.isConnecting && dragState.connectionStart) {
        // Actualizar conexión temporal
        setDragState((prev) => ({
          ...prev,
          tempConnection: { x, y },
        }));
      }
    },
    [dragState],
  );

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.newNodeType && canvasRef.current) {
        // Crear nuevo nodo
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - 40; // Centro del nodo
        const y = e.clientY - canvasRect.top - 20;

        const newNode: WorkflowNodeData = {
          id: `node-${nodeIdCounter.current++}`,
          title: `Nuevo ${dragState.newNodeType}`,
          type: dragState.newNodeType,
          x: Math.max(0, x),
          y: Math.max(0, y),
        };

        setNodes((prev) => [...prev, newNode]);
      }

      // Resetear estado de drag
      setDragState({
        isDragging: false,
        draggedNode: null,
        dragOffset: { x: 0, y: 0 },
        newNodeType: null,
        isConnecting: false,
        connectionStart: null,
        tempConnection: null,
      });
    },
    [dragState.newNodeType],
  );

  const handleNodeTypeDragStart = useCallback((nodeType: WorkflowNodeType) => {
    setDragState({
      isDragging: true,
      draggedNode: null,
      dragOffset: { x: 0, y: 0 },
      newNodeType: nodeType,
      isConnecting: false,
      connectionStart: null,
      tempConnection: null,
    });
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setConnections((prev) =>
        prev.filter((c) => c.from !== nodeId && c.to !== nodeId),
      );
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId],
  );

  const handleStartConnection = useCallback((nodeId: string) => {
    setDragState({
      isDragging: true,
      draggedNode: null,
      dragOffset: { x: 0, y: 0 },
      newNodeType: null,
      isConnecting: true,
      connectionStart: nodeId,
      tempConnection: null,
    });
  }, []);

  const handleCompleteConnection = useCallback(
    (targetNodeId: string) => {
      if (
        dragState.connectionStart &&
        dragState.connectionStart !== targetNodeId
      ) {
        const newConnection: Connection = {
          id: `c-${Date.now()}`,
          from: dragState.connectionStart,
          to: targetNodeId,
        };

        // Verificar si la conexión ya existe
        const connectionExists = connections.some(
          (c) => c.from === dragState.connectionStart && c.to === targetNodeId,
        );

        if (!connectionExists) {
          setConnections((prev) => [...prev, newConnection]);
        }
      }

      // Resetear estado de conexión
      setDragState({
        isDragging: false,
        draggedNode: null,
        dragOffset: { x: 0, y: 0 },
        newNodeType: null,
        isConnecting: false,
        connectionStart: null,
        tempConnection: null,
      });
    },
    [dragState.connectionStart, connections],
  );

  return (
    <div className="canvas-layout">
      <aside className="canvas-panel">
        <h3 className="panel-title">Arrastrar nodos</h3>
        <div className="node-palette">
          {(
            ["START", "ACTION", "CONDITIONAL", "END"] as WorkflowNodeType[]
          ).map((nodeType) => (
            <div
              key={nodeType}
              className={`draggable-node node node-${nodeType.toLowerCase()}`}
              onMouseDown={() => handleNodeTypeDragStart(nodeType)}
              style={{ cursor: "grab", marginBottom: "8px" }}
            >
              <span className="node-title">{nodeType}</span>
            </div>
          ))}
        </div>
        <div className="panel-section" style={{ marginTop: "20px" }}>
          <h4 className="panel-title">Instrucciones</h4>
          <ul
            className="panel-list"
            style={{ fontSize: "12px", lineHeight: "1.4" }}
          >
            <li>Arrastra nodos del panel al canvas</li>
            <li>Click en nodos para seleccionar</li>
            <li>Arrastra nodos para mover</li>
            <li>Click en "Eliminar" para borrar</li>
          </ul>
        </div>
      </aside>

      <section className="canvas-stage">
        <div className="canvas-toolbar">
          <div>
            <p className="hero-kicker">Workflow {workflowId}</p>
            <h2 className="workflows-title">Vista de canvas</h2>
          </div>
          <div className="canvas-actions">
            {actions}
            <span className="canvas-badge">Solo lectura</span>
          </div>
        </div>

        <div
          className="canvas-scroll"
          aria-label="Lienzo de workflow"
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{ cursor: dragState.isDragging ? "grabbing" : "default" }}
        >
          <div className="canvas-grid">
            <svg className="canvas-connections" viewBox="0 0 1600 800">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M 0 0 L 6 3 L 0 6" className="connection-arrow" />
                </marker>
              </defs>
              {dragState.isConnecting && dragState.tempConnection && (
                <line
                  x1={
                    nodes.find((n) => n.id === dragState.connectionStart)?.x! +
                    80
                  }
                  y1={
                    nodes.find((n) => n.id === dragState.connectionStart)?.y! +
                    20
                  }
                  x2={dragState.tempConnection.x}
                  y2={dragState.tempConnection.y}
                  stroke="#9e8bff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              )}
              {connections.map((connection) => {
                const from = nodes.find((node) => node.id === connection.from);
                const to = nodes.find((node) => node.id === connection.to);
                if (!from || !to) {
                  return null;
                }
                return (
                  <WorkflowConnection key={connection.id} from={from} to={to} />
                );
              })}
            </svg>

            {nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                onSelect={setSelectedNodeId}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onConnectionClick={
                  dragState.isConnecting
                    ? () => handleCompleteConnection(node.id)
                    : undefined
                }
                isConnectionTarget={
                  dragState.isConnecting &&
                  dragState.connectionStart !== node.id
                }
              />
            ))}
          </div>
        </div>
      </section>

      <aside className="canvas-panel canvas-panel-right">
        <h3 className="panel-title">Detalle del nodo</h3>
        {selectedNode ? (
          <div className="panel-card">
            <p className="panel-label">Título</p>
            <p className="panel-value">{selectedNode.title}</p>
            <p className="panel-label">Tipo</p>
            <p className="panel-value">{selectedNode.type}</p>
            <p className="panel-label">Posición</p>
            <p className="panel-value">
              X: {Math.round(selectedNode.x)}, Y: {Math.round(selectedNode.y)}
            </p>
            <div className="panel-section" style={{ marginTop: "16px" }}>
              <h4 className="panel-title">Conexiones</h4>
              <div style={{ fontSize: "12px" }}>
                <p>
                  Salidas:{" "}
                  {connections.filter((c) => c.from === selectedNode.id).length}
                </p>
                <p>
                  Entradas:{" "}
                  {connections.filter((c) => c.to === selectedNode.id).length}
                </p>
              </div>
              <button
                className="btn-secondary"
                style={{ marginTop: "8px", width: "100%", fontSize: "12px" }}
                onClick={() => handleStartConnection(selectedNode.id)}
              >
                Conectar desde aquí
              </button>
            </div>
            {selectedNode.id !== "start" && (
              <button
                className="btn-primary btn-danger"
                style={{ marginTop: "12px", width: "100%" }}
                onClick={() => handleDeleteNode(selectedNode.id)}
              >
                Eliminar nodo
              </button>
            )}
          </div>
        ) : (
          <p className="panel-empty">Selecciona un nodo para ver detalles.</p>
        )}
      </aside>
    </div>
  );
}
