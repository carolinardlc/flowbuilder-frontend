"use client";

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
import type { CanvasProps, Connection, WorkflowNodeData } from "./types";
import { useWorkflows } from "../../../context/WorkflowsContext";
import {
  toExportWorkflow,
  type Workflow as WorkflowSerializationModel,
} from "./domain/serialization";
import { validateWorkflow } from "./domain/validation";
import { postWorkflow } from "./services/workflowApi";
import { downloadWorkflowJson } from "./services/workflowFile";

/**
 * Componente principal del Canvas de Workflow
 *
 * Este componente maneja la visualización y interacción del canvas donde los usuarios
 * pueden crear, conectar y configurar nodos de workflow.
 */
export default function Canvas({ workflowId, actions }: CanvasProps) {
  const isNodeTypeKey = (
    type: (typeof NODE_TYPE_ARRAY)[number]["type"] | null,
  ): type is keyof typeof NODE_TYPES => {
    return !!type && type in NODE_TYPES;
  };
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
    (loadedNodes: WorkflowNodeData[]) => {
      setNodes(loadedNodes);
    },
    [setNodes],
  );

  const handleConnectionsLoaded = useCallback(
    (loadedConnections: Connection[]) => {
      setConnections(loadedConnections);
    },
    [setConnections],
  );

  const handleNodeIdCounterUpdate = useCallback(() => {
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
  const [validationResult, setValidationResult] = useState<{
    status: "idle" | "ok" | "error";
    messages: string[];
  }>({ status: "idle", messages: [] });
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionKey, setExecutionKey] = useState(0);
  const [sendResult, setSendResult] = useState<{
    status: "idle" | "ok" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [backendTerminalOutput, setBackendTerminalOutput] =
    useState<string>("");

  const incomingNodeOptions = (() => {
    if (!selectedNode || selectedNode.type !== "CONDITIONAL") return [];

    const incomingByTo = new Map<string, string[]>();
    connections.forEach((c) => {
      const list = incomingByTo.get(c.to) ?? [];
      list.push(c.from);
      incomingByTo.set(c.to, list);
    });

    const visited = new Set<string>();
    const resultIds: string[] = [];
    const stack: string[] = [...(incomingByTo.get(selectedNode.id) ?? [])];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      resultIds.push(currentId);

      const parents = incomingByTo.get(currentId) ?? [];
      parents.forEach((p) => {
        if (!visited.has(p)) stack.push(p);
      });
    }

    return resultIds
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is NonNullable<typeof n> => !!n)
      .filter((n) => n.type !== "START")
      .map((n) => ({ id: n.id, name: n.title, type: n.type }));
  })();

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

  const handleDownloadJson = () => {
    // Refactor: serialización y descarga delegadas a dominio + servicio.
    const workflowModel: WorkflowSerializationModel = {
      id: workflowId,
      name: workflowName ?? `Workflow ${workflowId}`,
      nodes,
      connections,
    };
    const payload = toExportWorkflow(workflowModel);
    downloadWorkflowJson(payload, workflowModel.name);
  };

  const handleSendToBackend = async () => {
    try {
      // Refactor: mapeo backend y llamada de red aislados de la UI.
      const workflowModel: WorkflowSerializationModel = {
        id: workflowId,
        name: workflowName ?? `Workflow ${workflowId}`,
        nodes,
        connections,
      };
      const payload = toExportWorkflow(workflowModel);
      let endpoint: string | undefined = undefined;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("backend-config");
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<{
              url: string;
              port: string;
            }>;
            const url = typeof parsed.url === "string" ? parsed.url.trim() : "";
            const port =
              typeof parsed.port === "string" ? parsed.port.trim() : "";
            if (url && port) {
              endpoint = `http://${url}:${port}/api/workflows/run`;
            }
          }
        } catch {
          endpoint = undefined;
        }
      }

      const result = await postWorkflow(payload, endpoint);

      if (!result.ok) {
        setBackendTerminalOutput(
          result.bodyText || `Backend error: ${result.status}`,
        );
        throw new Error(`Backend error: ${result.status}`);
      }

      setBackendTerminalOutput(result.bodyText || "(sin contenido)");
      setSendResult({
        status: "ok",
        message: "Workflow enviado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido.";
      setBackendTerminalOutput(message);
      setSendResult({ status: "error", message });
    } finally {
      setIsSendOpen(true);
    }
  };

  const runWorkflowValidation = () => {
    const errors = validateWorkflow({ nodes, connections }).map(
      (error) => error.message,
    );
    if (errors.length === 0) {
      setValidationResult({
        status: "ok",
        messages: ["Workflow válido. No se encontraron errores."],
      });
    } else {
      setValidationResult({ status: "error", messages: errors });
    }
    setIsValidationOpen(true);
  };

  const handleExecuteWorkflow = () => {
    const errors = validateWorkflow({ nodes, connections }).map(
      (error) => error.message,
    );
    if (errors.length > 0) {
      setValidationResult({ status: "error", messages: errors });
      setIsValidationOpen(true);
      return;
    }

    setIsExecuting(false);
    setExecutionKey((prev) => prev + 1);
    requestAnimationFrame(() => {
      setIsExecuting(true);
      window.setTimeout(() => setIsExecuting(false), 2200);
    });
  };

  const buildConnectionPath = (
    fromNodeId: string,
    toNodeId: string,
    fromOffsetY?: number,
  ) => {
    const from = nodes.find((node) => node.id === fromNodeId);
    const to = nodes.find((node) => node.id === toNodeId);
    if (!from || !to) return null;

    const startX = from.x + CANVAS_CONFIG.CONNECTION_OFFSET_X;
    const startY = from.y + (fromOffsetY ?? CANVAS_CONFIG.CONNECTION_OFFSET_Y);
    const endX = to.x;
    const endY = to.y + CANVAS_CONFIG.CONNECTION_OFFSET_Y;
    const controlX = (startX + endX) / 2;

    return `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
  };

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
      {/* Panel izquierdo - Export + Paleta de nodos */}
      <div className="canvas-side canvas-side-offset">
        <aside className="canvas-panel">
          <h3 className="panel-title">Arrastrar nodos</h3>
          <div className="node-palette">
            {NODE_TYPE_ARRAY.map((nodeType) => (
              <div
                key={nodeType.type}
                className={`draggable-node node node-${nodeType.type.toLowerCase()} ${
                  dragState.isDragging &&
                  dragState.newNodeType === nodeType.type
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

        <aside className="canvas-panel canvas-panel-compact">
          <h3 className="panel-title">Exportar JSON</h3>
          <div className="panel-actions">
            <button className="btn-primary" onClick={handleDownloadJson}>
              Descargar
            </button>
            <button
              className="btn-secondary panel-send-button"
              onClick={handleSendToBackend}
            >
              Enviar al backend
            </button>
          </div>

          <div className="form-group" style={{ marginTop: "14px" }}>
            <label className="form-label">Terminal de salida</label>
            <textarea
              className="form-textarea"
              value={backendTerminalOutput}
              readOnly
              rows={10}
            />
          </div>
        </aside>
      </div>

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
                  setSelectedNodeId(nodeId);
                  setSelectedConnectionId(null);
                }}
                onDoubleClick={(nodeId) => {
                  setSelectedNodeId(nodeId);
                  setSelectedConnectionId(null);
                  setIsConfigPanelOpen(true);
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

            {isExecuting && (
              <svg
                className="canvas-connections execution-layer"
                key={executionKey}
              >
                {connections.map((connection, index) => {
                  const path = buildConnectionPath(
                    connection.from,
                    connection.to,
                    connection.fromOffsetY,
                  );
                  if (!path) return null;
                  return (
                    <g key={`exec-${connection.id}`}>
                      <path d={path} fill="none" stroke="none" />
                      <circle className="execution-dot" r="4">
                        <animateMotion
                          dur="1.2s"
                          begin={`${index * 0.2}s`}
                          path={path}
                          repeatCount="1"
                          fill="freeze"
                        />
                      </circle>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </section>

      {/* Panel derecho - Detalles del nodo */}
      <aside className="canvas-panel canvas-panel-right canvas-panel-offset">
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

        <div className="panel-card" style={{ marginTop: "12px" }}>
          <p className="panel-label">Ejecutar</p>
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={handleExecuteWorkflow}
          >
            Ejecutar
          </button>
        </div>

        <div className="panel-card" style={{ marginTop: "12px" }}>
          <p className="panel-label">Validar workflow</p>
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={runWorkflowValidation}
          >
            Validar Workflow
          </button>
        </div>
      </aside>

      {/* Panel de configuración */}
      <NodeConfigPanel
        node={selectedNode}
        isOpen={isConfigPanelOpen}
        onClose={handleCloseConfig}
        onSave={handleSaveConfig}
        incomingNodeOptions={incomingNodeOptions}
      />

      {dragState.isDragging &&
        isNodeTypeKey(dragState.newNodeType) &&
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

      {isValidationOpen && validationResult.status !== "idle" && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="workflows-title">Validación de workflow</h2>
            {validationResult.status === "ok" ? (
              <p className="workflows-subtitle" style={{ color: "#2f7d67" }}>
                {validationResult.messages[0]}
              </p>
            ) : (
              <>
                <p className="workflows-subtitle">
                  Se encontraron los siguientes errores:
                </p>
                <ul
                  style={{ margin: 0, paddingLeft: "18px", color: "#c45757" }}
                >
                  {validationResult.messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="form-actions">
              <button
                className="btn-secondary"
                onClick={() => setIsValidationOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isSendOpen && sendResult.status !== "idle" && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="workflows-title">Envío al backend</h2>
            <p
              className="workflows-subtitle"
              style={{
                color: sendResult.status === "ok" ? "#2f7d67" : "#c45757",
              }}
            >
              {sendResult.message}
            </p>
            <div className="form-actions">
              <button
                className="btn-secondary"
                onClick={() => setIsSendOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
