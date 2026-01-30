"use client";

import { useState, useCallback, useEffect } from "react";
import WorkflowConnection from "./WorkflowConnection";
import WorkflowNode from "./WorkflowNode";
import NodeConfigPanel from "./NodeConfigPanel";
import { NODE_TYPE_ARRAY } from "./constants/nodeTypes";
import { CANVAS_CONFIG } from "./constants/storage";
import { useCanvasState } from "./hooks/useCanvasState";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useConnections } from "./hooks/useConnections";
import { createNode } from "./utils/nodeUtils";
import type { CanvasProps } from "./types";

/**
 * Componente principal del Canvas de Workflow
 *
 * Este componente maneja la visualización y interacción del canvas donde los usuarios
 * pueden crear, conectar y configurar nodos de workflow.
 */
export default function Canvas({ workflowId, actions }: CanvasProps) {
  // Estado local para el contador de IDs
  const [nextNodeId, setNextNodeId] = useState(1);
  const [canvasSize, setCanvasSize] = useState(() => ({
    width: CANVAS_CONFIG.BASE_CANVAS_WIDTH,
    height: CANVAS_CONFIG.BASE_CANVAS_HEIGHT,
  }));

  // Estado principal del canvas
  const {
    nodes,
    connections,
    selectedNode,
    selectedNodeId,
    isConfigPanelOpen,
    dragState,
    setNodes,
    setConnections,
    setSelectedNodeId,
    setDragState,
    handleOpenConfig,
    handleCloseConfig,
    handleSaveConfig,
    handleDeleteNode,
  } = useCanvasState();

  // Funciones memorizadas para localStorage
  const handleNodesLoaded = useCallback(
    (loadedNodes: typeof nodes) => {
      setNodes(loadedNodes);
    },
    [setNodes],
  );

  const handleConnectionsLoaded = useCallback(
    (loadedConnections: typeof connections) => {
      setConnections(loadedConnections);
    },
    [setConnections],
  );

  const handleNodeIdCounterUpdate = useCallback((counter: number) => {
    setNextNodeId(counter);
  }, []);

  const handleSetNextNodeId = useCallback((id: number) => {
    setNextNodeId(id);
  }, []);

  // Hook para persistencia en localStorage
  useLocalStorage({
    workflowId,
    nodes,
    connections,
    onNodesLoaded: handleNodesLoaded,
    onConnectionsLoaded: handleConnectionsLoaded,
    onNodeIdCounterUpdate: handleNodeIdCounterUpdate,
    onSetNextNodeId: handleSetNextNodeId,
  });

  // Hook para manejo de drag and drop
  const {
    canvasRef,
    handleNodeMouseDown,
    handleNodeTypeDragStart,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  } = useDragAndDrop({
    nodes,
    onNodesChange: setNodes,
    onNodeSelect: setSelectedNodeId,
    onDragStateChange: setDragState,
  });

  // Hook para manejo de conexiones
  const {
    handleStartConnection,
    handleCompleteConnection,
    handleCancelConnection,
    handleDeleteNode: handleDeleteNodeWithConnections,
  } = useConnections({
    nodes,
    connections,
    onConnectionsChange: setConnections,
    onDragStateChange: setDragState,
  });

  // Dimensiones responsivas del canvas (80% del viewport con mÃ­nimos seguros)
  useEffect(() => {
    const updateCanvasSize = () => {
      if (typeof window === "undefined") return;

      const width = Math.max(
        CANVAS_CONFIG.MIN_CANVAS_WIDTH,
        Math.round(window.innerWidth * CANVAS_CONFIG.CANVAS_WIDTH_RATIO),
      );
      const height = Math.max(
        CANVAS_CONFIG.MIN_CANVAS_HEIGHT,
        Math.round(window.innerHeight * CANVAS_CONFIG.CANVAS_HEIGHT_RATIO),
      );

      setCanvasSize({ width, height });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Manejo personalizado del mouse up para crear nodos
  const handleCanvasMouseUpWithNodeCreation = (e: React.MouseEvent) => {
    const nodeType = dragState.newNodeType;

    if (nodeType && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left - CANVAS_CONFIG.NODE_WIDTH / 2;
      const y = e.clientY - canvasRect.top - CANVAS_CONFIG.NODE_HEIGHT / 2;

      const newNode = createNode(nodeType, x, y, nextNodeId);
      setNodes([...nodes, newNode]);
      setSelectedNodeId(newNode.id);
      setNextNodeId(nextNodeId + 1);
    }

    handleCanvasMouseUp(e, dragState);
  };

  // Manejo de eliminación de nodo
  const handleDeleteNodeComplete = (nodeId: string) => {
    handleDeleteNode(nodeId);
    handleDeleteNodeWithConnections(nodeId, selectedNodeId, setSelectedNodeId);
  };

  return (
    <div className="canvas-layout">
      {/* Panel izquierdo - Paleta de nodos */}
      <aside className="canvas-panel">
        <h3 className="panel-title">Arrastrar nodos</h3>
        <div className="node-palette">
          {NODE_TYPE_ARRAY.map((nodeType) => (
            <div
              key={nodeType.type}
              className={`draggable-node node node-${nodeType.type.toLowerCase()}`}
              onMouseDown={() => handleNodeTypeDragStart(nodeType.type)}
              style={{ cursor: "grab", marginBottom: "8px" }}
            >
              <span className="node-title">{nodeType.label}</span>
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
            <li>Click en el botón Eliminar para borrar</li>
            <li>
              Para conectar: arrastra el punto de salida morado hacia el punto
              de entrada gris del nodo destino
            </li>
          </ul>
        </div>
      </aside>

      {/* Canvas principal */}
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
          onMouseMove={(e) => handleCanvasMouseMove(e, dragState)}
          onMouseUp={handleCanvasMouseUpWithNodeCreation}
          onMouseLeave={
            dragState.isConnecting
              ? handleCancelConnection
              : () => handleCanvasMouseUp({} as React.MouseEvent, dragState)
          }
          onClick={dragState.isConnecting ? handleCancelConnection : undefined}
          style={{
            cursor: dragState.isDragging
              ? "grabbing"
              : dragState.isConnecting
                ? "crosshair"
                : "default",
          }}
        >
          <div
            className="canvas-grid"
            style={{
              position: "relative",
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            {/* SVG para conexiones */}
            <svg className="canvas-connections">
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

              {/* Línea temporal durante conexión */}
              {dragState.isConnecting && dragState.tempConnection && (
                <line
                  x1={
                    (nodes.find((n) => n.id === dragState.connectionStart)?.x ??
                      0) + CANVAS_CONFIG.CONNECTION_OFFSET_X
                  }
                  y1={
                    (nodes.find((n) => n.id === dragState.connectionStart)?.y ??
                      0) + CANVAS_CONFIG.CONNECTION_OFFSET_Y
                  }
                  x2={dragState.tempConnection.x}
                  y2={dragState.tempConnection.y}
                  stroke="#7c3aed"
                  strokeWidth="3"
                  strokeDasharray="6,4"
                  opacity="0.8"
                />
              )}

              {/* Conexiones existentes */}
              {connections.map((connection) => {
                const from = nodes.find((node) => node.id === connection.from);
                const to = nodes.find((node) => node.id === connection.to);
                if (!from || !to) return null;

                return (
                  <WorkflowConnection key={connection.id} from={from} to={to} />
                );
              })}
            </svg>

            {/* Mensaje cuando el canvas está vacío */}
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

            {/* Renderizado de nodos */}
            {nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                onSelect={setSelectedNodeId}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onConnectionClick={
                  dragState.isConnecting
                    ? () => handleCompleteConnection(node.id, dragState)
                    : undefined
                }
                onStartConnection={() => handleStartConnection(node.id)}
                onCompleteConnection={
                  dragState.isConnecting
                    ? () => handleCompleteConnection(node.id, dragState)
                    : undefined
                }
                isConnectionTarget={
                  dragState.isConnecting &&
                  dragState.connectionStart !== node.id
                }
                isConnectionSource={dragState.connectionStart === node.id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Panel derecho - Detalles del nodo */}
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
              onClick={() => handleDeleteNodeComplete(selectedNode.id)}
            >
              Eliminar nodo
            </button>
          </div>
        ) : (
          <p className="panel-empty">Selecciona un nodo para ver detalles.</p>
        )}
      </aside>

      {/* Panel de configuración */}
      <NodeConfigPanel
        node={selectedNode}
        isOpen={isConfigPanelOpen}
        onClose={handleCloseConfig}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
