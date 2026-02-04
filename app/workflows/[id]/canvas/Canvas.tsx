"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import WorkflowConnection from "./WorkflowConnection";
import WorkflowNode from "./WorkflowNode";
import NodeConfigPanel from "./NodeConfigPanel";
import { NODE_TYPES, NODE_TYPE_ARRAY } from "./constants/nodeTypes";
import { CANVAS_CONFIG } from "./constants/storage";
import { useCanvasState } from "./hooks/useCanvasState";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useConnections } from "./hooks/useConnections";
import { createNode } from "./utils/nodeUtils";
import type { CanvasProps } from "./types";
import { useWorkflows } from "../../../context/WorkflowsContext";

/**
 * Componente principal del Canvas de Workflow
 *
 * Este componente maneja la visualización y interacción del canvas donde los usuarios
 * pueden crear, conectar y configurar nodos de workflow.
 */
export default function Canvas({ workflowId, actions }: CanvasProps) {
  const { workflows } = useWorkflows();
  const workflowName =
    workflows.find((workflow) => workflow.id === workflowId)?.name ?? null;
  // Estado local para el contador de IDs
  const [nextNodeId, setNextNodeId] = useState(1);
  const [justCreatedNodeId, setJustCreatedNodeId] = useState<string | null>(
    null,
  );
  const dropTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setIsConfigPanelOpen,
    setDragState,
    handleOpenConfig,
    handleCloseConfig,
    handleSaveConfig,
    handleDeleteNode,
    handleDuplicateNode,
  } = useCanvasState();

  // Funciones memorizadas para localStorage
  const handleNodesLoaded = useCallback(
    (nodes: any[]) => {
      setNodes(nodes);
    },
    [setNodes],
  );

  const handleConnectionsLoaded = useCallback(
    (connections: any[]) => {
      setConnections(connections);
    },
    [setConnections],
  );

  const handleNodeIdCounterUpdate = useCallback((counter: number) => {
    // Actualizar el contador de nodos
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
    handleDeleteConnection,
  } = useConnections({
    nodes,
    connections,
    onConnectionsChange: setConnections,
    onDragStateChange: setDragState,
  });

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
      setJustCreatedNodeId(newNode.id);

      if (dropTimeoutRef.current) {
        clearTimeout(dropTimeoutRef.current);
      }
      dropTimeoutRef.current = setTimeout(() => {
        setJustCreatedNodeId(null);
      }, 180);
    }

    handleCanvasMouseUp(e, dragState);
  };

  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);

  // Manejo de eliminación de nodo
  const handleDeleteNodeComplete = (nodeId: string) => {
    handleDeleteNode(nodeId);
    handleDeleteNodeWithConnections(nodeId, selectedNodeId, setSelectedNodeId);
    if (selectedConnectionId) {
      setSelectedConnectionId(null);
    }
  };

  // Manejo de duplicación de nodo
  const handleDuplicateNodeComplete = (nodeId: string) => {
    const newNodeId = `node-${nextNodeId}`;
    handleDuplicateNode(nodeId, newNodeId);
    setNextNodeId(nextNodeId + 1);
  };

  useEffect(() => {
    return () => {
      if (dropTimeoutRef.current) {
        clearTimeout(dropTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!dragState.isDragging || !dragState.newNodeType) {
      return;
    }

    const handleWindowMouseMove = (event: MouseEvent) => {
      setDragState((prev) => {
        if (!prev.isDragging || !prev.newNodeType) {
          return prev;
        }
        return {
          ...prev,
          cursorPosition: { x: event.clientX, y: event.clientY },
        };
      });
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
    };
  }, [dragState.isDragging, dragState.newNodeType, setDragState]);

  return (
    <div className="canvas-layout">
      {/* Panel izquierdo - Paleta de nodos */}
      <aside className="canvas-panel">
        <h3 className="panel-title">Arrastrar nodos</h3>
        <div className="node-palette">
          {NODE_TYPE_ARRAY.map((nodeType) => (
            <div
              key={nodeType.type}
              className={`draggable-node node node-${nodeType.type.toLowerCase()} ${dragState.isDragging && dragState.newNodeType === nodeType.type
                  ? "draggable-node-active"
                  : ""
                }`}
              onMouseDown={(e) => handleNodeTypeDragStart(nodeType.type, e)}
              style={{ cursor: "grab", marginBottom: "8px" }}
            >
              <span className="node-title" style={{ fontSize: "0.9rem" }}>
                {nodeType.label}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* Canvas principal */}
      <section className="canvas-stage">
        <div className="canvas-toolbar">
          <div>
            <p className="hero-kicker">Workflow</p>
            <h2 className="workflows-title">
              {workflowName ?? `Workflow ${workflowId}`}
            </h2>
            <p className="workflows-subtitle">Vista de canvas</p>
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
          onMouseDown={() => setSelectedConnectionId(null)}
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
              width: CANVAS_CONFIG.BASE_CANVAS_WIDTH,
              height: CANVAS_CONFIG.BASE_CANVAS_HEIGHT,
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
                      0) +
                    (dragState.connectionStartOffsetY ??
                      CANVAS_CONFIG.CONNECTION_OFFSET_Y)
                  }
                  x2={dragState.tempConnection.x}
                  y2={dragState.tempConnection.y}
                  stroke="#9e8bff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              )}

              {/* Conexiones existentes */}
              {connections.map((connection) => {
                const from = nodes.find((node) => node.id === connection.from);
                const to = nodes.find((node) => node.id === connection.to);
                if (!from || !to) return null;

                return (
                  <WorkflowConnection
                    key={connection.id}
                    id={connection.id}
                    from={from}
                    to={to}
                    fromOffsetY={connection.fromOffsetY}
                    isSelected={selectedConnectionId === connection.id}
                    onSelect={(id) => {
                      setSelectedConnectionId(id);
                      setSelectedNodeId(null);
                    }}
                  />
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
                isDragging={dragState.draggedNode === node.id}
                isJustCreated={node.id === justCreatedNodeId}
                onSelect={(nodeId) => {
                  const node = nodes.find((item) => item.id === nodeId);
                  setSelectedNodeId(nodeId);
                  setSelectedConnectionId(null);
                  if (node?.type === "CONDITIONAL") {
                    setIsConfigPanelOpen(true);
                  }
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onConnectionClick={
                  dragState.isConnecting
                    ? () => handleCompleteConnection(node.id, dragState)
                    : undefined
                }
                onStartConnection={(nodeId, offsetY) =>
                  handleStartConnection(nodeId, offsetY)
                }
                onCompleteConnection={(nodeId) =>
                  handleCompleteConnection(nodeId, dragState)
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
                onClick={handleOpenConfig}
              >
                ⚙️ Configurar Nodo
              </button>
            </div>

            {selectedNode.type !== "START" && (
              <button
                className="btn-primary"
                style={{ marginTop: "12px", width: "100%" }}
                onClick={() => handleDuplicateNodeComplete(selectedNode.id)}
              >
                Duplicar nodo
              </button>
            )}
            <button
              className="btn-primary btn-danger"
              style={{ marginTop: "12px", width: "100%" }}
              onClick={() => handleDeleteNodeComplete(selectedNode.id)}
            >
              Eliminar nodo
            </button>
          </div>
        ) : selectedConnectionId ? (
          <div className="panel-card">
            <p className="panel-label">Conexión seleccionada</p>
            <p className="panel-value">ID: {selectedConnectionId}</p>
            <button
              className="btn-secondary btn-danger"
              style={{ marginTop: "12px", width: "100%" }}
              onClick={() => {
                handleDeleteConnection(selectedConnectionId);
                setSelectedConnectionId(null);
              }}
            >
              Eliminar conexión
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

      {dragState.isDragging &&
        dragState.newNodeType &&
        dragState.cursorPosition && (
          <div
            className={`node node-drag-preview node-${dragState.newNodeType.toLowerCase()}`}
            style={{
              position: "fixed",
              left: dragState.cursorPosition.x - CANVAS_CONFIG.NODE_WIDTH / 2,
              top: dragState.cursorPosition.y - CANVAS_CONFIG.NODE_HEIGHT / 2,
              pointerEvents: "none",
            }}
          >
            <span className="node-title">
              {NODE_TYPES[dragState.newNodeType].label}
            </span>
            <span className="node-type">{dragState.newNodeType}</span>
          </div>
        )}
    </div>
  );
}
