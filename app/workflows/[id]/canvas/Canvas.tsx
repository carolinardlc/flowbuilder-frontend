"use client";

import type { ReactNode } from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import WorkflowConnection from "./WorkflowConnection";
import WorkflowNode, {
  type WorkflowNodeData,
  type WorkflowNodeType,
} from "./WorkflowNode";
import NodeConfigPanel from "./NodeConfigPanel";

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // ✅ VACÍO por defecto
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

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

  // ✅ IDs limpios desde 1
  const nodeIdCounter = useRef(1);

  // ✅ Key segura por workflowId (evita "undefined")
  const safeWorkflowId = String(workflowId ?? "").trim();
  const storageKey = safeWorkflowId
    ? `workflow-canvas:${safeWorkflowId}`
    : null;

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  // Manejadores del panel de configuración
  const handleOpenConfig = useCallback(() => {
    if (selectedNode) {
      setIsConfigPanelOpen(true);
    }
  }, [selectedNode]);

  const handleCloseConfig = useCallback(() => {
    setIsConfigPanelOpen(false);
  }, []);

  const handleSaveConfig = useCallback((config: any) => {
    console.log("Canvas: Recibiendo configuración para guardar:", config);
    setNodes((prev) => {
      const updatedNodes = prev.map((node) =>
        node.id === config.id
          ? {
              ...node,
              title: config.title,
              // Guardar la configuración adicional en el nodo
              config: config.config,
            }
          : node,
      );
      console.log("Canvas: Nodos actualizados:", updatedNodes);
      return updatedNodes;
    });
    setIsConfigPanelOpen(false);
  }, []);

  // =========================
  // ✅ CARGAR desde localStorage
  // =========================
  useEffect(() => {
    if (!storageKey) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        nodes?: WorkflowNodeData[];
        connections?: Connection[];
      };

      const loadedNodes = parsed.nodes ?? [];
      const loadedConnections = parsed.connections ?? [];

      setNodes(loadedNodes);
      setConnections(loadedConnections);

      // Recalcular contador para no repetir ids
      const maxNum =
        loadedNodes
          .map((n) => Number(String(n.id).replace("node-", "")))
          .filter((x) => Number.isFinite(x))
          .reduce((a, b) => Math.max(a, b), 0) || 0;

      nodeIdCounter.current = maxNum + 1;
    } catch (err) {
      console.error("Error loading canvas", err);
    }
  }, [storageKey]);

  // =========================
  // ✅ GUARDAR en localStorage
  // =========================
  useEffect(() => {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify({ nodes, connections }));
    } catch (err) {
      console.error("Error saving canvas", err);
    }
  }, [storageKey, nodes, connections]);

  // =========================
  // Arrastrar un nodo existente
  // =========================
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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

  // =========================
  // Mouse move en canvas
  // =========================
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
        return;
      }

      if (dragState.isConnecting && dragState.connectionStart) {
        // Conexión temporal (línea punteada)
        setDragState((prev) => ({
          ...prev,
          tempConnection: { x, y },
        }));
      }
    },
    [dragState],
  );

  // =========================
  // Mouse up en canvas
  // =========================
  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const nodeType = dragState.newNodeType;

      // Crear nuevo nodo (si venías arrastrando desde la paleta)
      if (nodeType && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - 40;
        const y = e.clientY - canvasRect.top - 20;

        const newNode: WorkflowNodeData = {
          id: `node-${nodeIdCounter.current++}`,
          title: `Nuevo ${nodeType}`,
          type: nodeType,
          x: Math.max(0, x),
          y: Math.max(0, y),
        };

        setNodes((prev) => [...prev, newNode]);
        setSelectedNodeId(newNode.id);
      }

      // ✅ Reset drag/connect
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

  // =========================
  // Iniciar “drag” desde paleta
  // =========================
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

  // =========================
  // Eliminar nodo
  // =========================
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

  // =========================
  // Iniciar conexión desde nodo (botón “Conectar desde aquí”)
  // =========================
  const handleStartConnection = useCallback(
    (nodeId: string) => {
      const startNode = nodes.find((n) => n.id === nodeId);
      if (!startNode) return;

      const startX = startNode.x + 180;
      const startY = startNode.y + 40;

      setDragState({
        isDragging: true,
        draggedNode: null,
        dragOffset: { x: 0, y: 0 },
        newNodeType: null,
        isConnecting: true,
        connectionStart: nodeId,
        tempConnection: { x: startX, y: startY },
      });
    },
    [nodes],
  );

  // =========================
  // Completar conexión (click en nodo destino)
  // =========================
  const handleCompleteConnection = useCallback(
    (targetNodeId: string) => {
      if (!dragState.connectionStart) return;
      if (dragState.connectionStart === targetNodeId) return;

      const fromId = dragState.connectionStart;
      const toId = targetNodeId;

      const connectionExists = connections.some(
        (c) => c.from === fromId && c.to === toId,
      );

      if (!connectionExists) {
        setConnections((prev) => [
          ...prev,
          { id: `c-${Date.now()}`, from: fromId, to: toId },
        ]);
      }

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
            style={{ fontSize: "12px", lineHeight: 1.4 }}
          >
            <li>Arrastra nodos del panel al canvas</li>
            <li>Click en nodos para seleccionar</li>
            <li>Arrastra nodos para mover</li>
            <li>Click en "Eliminar" para borrar</li>
            <li>
              Para conectar: “Conectar desde aquí” y luego click en el nodo
              destino
            </li>
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
          <div className="canvas-grid" style={{ position: "relative" }}>
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

              {/* Línea punteada temporal */}
              {dragState.isConnecting && dragState.tempConnection && (
                <line
                  x1={
                    (nodes.find((n) => n.id === dragState.connectionStart)?.x ??
                      0) + 180
                  }
                  y1={
                    (nodes.find((n) => n.id === dragState.connectionStart)?.y ??
                      0) + 40
                  }
                  x2={dragState.tempConnection.x}
                  y2={dragState.tempConnection.y}
                  stroke="#9e8bff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              )}

              {/* Conexiones reales */}
              {connections.map((connection) => {
                const from = nodes.find((node) => node.id === connection.from);
                const to = nodes.find((node) => node.id === connection.to);
                if (!from || !to) return null;

                return (
                  <WorkflowConnection key={connection.id} from={from} to={to} />
                );
              })}
            </svg>

            {/* Mensaje si está vacío */}
            {nodes.length === 0 && (
              <div
                className="canvas-empty"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "14px",
                  opacity: 0.7,
                  pointerEvents: "none",
                }}
              >
                Arrastra un nodo desde el panel izquierdo para comenzar
              </div>
            )}

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
              <button
                className="btn-secondary"
                style={{ marginTop: "8px", width: "100%", fontSize: "12px" }}
                onClick={handleOpenConfig}
              >
                ⚙️ Configurar Nodo
              </button>
            </div>

            <button
              className="btn-primary btn-danger"
              style={{ marginTop: "12px", width: "100%" }}
              onClick={() => handleDeleteNode(selectedNode.id)}
            >
              Eliminar nodo
            </button>
          </div>
        ) : (
          <p className="panel-empty">Selecciona un nodo para ver detalles.</p>
        )}
      </aside>

      {/* Panel de Configuración */}
      <NodeConfigPanel
        node={selectedNode}
        isOpen={isConfigPanelOpen}
        onClose={handleCloseConfig}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
