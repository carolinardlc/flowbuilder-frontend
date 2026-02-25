"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StatusModal from "../../../components/StatusModal";
import WorkflowNode from "./WorkflowNode";
import NodeConfigPanel from "./NodeConfigPanel";
import { CANVAS_CONFIG } from "./constants/storage";
import { useCanvasState } from "./hooks/useCanvasState";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useConnections } from "./hooks/useConnections";
import { useWorkflowExecution } from "./hooks/useWorkflowExecution";
import { createNode } from "./utils/nodeUtils";
import type { CanvasProps, Connection, WorkflowNodeData } from "./types";
import { useWorkflows } from "../../../context/WorkflowsContext";
import NodePalette from "./components/NodePalette";
import NodeDetailPanel from "./components/NodeDetailPanel";
import CanvasConnectionsLayer from "./components/CanvasConnectionsLayer";
import DragPreview from "./components/DragPreview";
import ExecutionLayer from "./components/ExecutionLayer";

type IncomingNodeOption = { id: string; name: string; type: string };

const buildIncomingConnectionsIndex = (connections: Connection[]) => {
  const incomingByTo = new Map<string, string[]>();
  connections.forEach((connection) => {
    const list = incomingByTo.get(connection.to) ?? [];
    list.push(connection.from);
    incomingByTo.set(connection.to, list);
  });
  return incomingByTo;
};

const canVisitAncestor = (
  nodeId: string | undefined,
  visited: Set<string>,
): nodeId is string => !!nodeId && !visited.has(nodeId);

const enqueueUnvisitedParents = (
  nodeId: string,
  incomingByTo: Map<string, string[]>,
  visited: Set<string>,
  stack: string[],
) => {
  const parents = incomingByTo.get(nodeId) ?? [];
  parents.forEach((parentId) => {
    if (!visited.has(parentId)) stack.push(parentId);
  });
};

const collectAncestorNodeIds = (
  nodeId: string,
  incomingByTo: Map<string, string[]>,
) => {
  const visited = new Set<string>();
  const resultIds: string[] = [];
  const stack: string[] = [...(incomingByTo.get(nodeId) ?? [])];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!canVisitAncestor(currentId, visited)) continue;
    visited.add(currentId);
    resultIds.push(currentId);
    enqueueUnvisitedParents(currentId, incomingByTo, visited, stack);
  }

  return resultIds;
};

const mapNodesToIncomingOptions = (
  nodeIds: string[],
  nodes: WorkflowNodeData[],
): IncomingNodeOption[] =>
  nodeIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n)
    .filter((n) => n.type !== "START")
    .map((n) => ({ id: n.id, name: n.title, type: n.type }));

const getIncomingNodeOptions = (
  selectedNode: WorkflowNodeData | null,
  nodes: WorkflowNodeData[],
  connections: Connection[],
): IncomingNodeOption[] => {
  if (!selectedNode || selectedNode.type !== "CONDITIONAL") return [];
  const incomingByTo = buildIncomingConnectionsIndex(connections);
  const ancestorNodeIds = collectAncestorNodeIds(selectedNode.id, incomingByTo);
  return mapNodesToIncomingOptions(ancestorNodeIds, nodes);
};

/**
 * Componente principal del Canvas de Workflow
 *
 * Este componente maneja la visualización y interacción del canvas donde los usuarios
 * pueden crear, conectar y configurar nodos de workflow.
 */
export default function Canvas({ workflowId, actions }: CanvasProps) {
  const { workflows } = useWorkflows();
  const workflowName =
    workflows.find((w) => w.id === workflowId)?.name ?? null;

  const [nextNodeId, setNextNodeId] = useState(1);
  const [justCreatedNodeId, setJustCreatedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const dropTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleNodesLoaded = useCallback(
    (loaded: WorkflowNodeData[]) => setNodes(loaded),
    [setNodes],
  );
  const handleConnectionsLoaded = useCallback(
    (loaded: Connection[]) => setConnections(loaded),
    [setConnections],
  );
  const handleNodeIdCounterUpdate = useCallback(() => {}, []);
  const handleSetNextNodeId = useCallback((id: number) => setNextNodeId(id), []);

  useLocalStorage({
    workflowId,
    nodes,
    connections,
    onNodesLoaded: handleNodesLoaded,
    onConnectionsLoaded: handleConnectionsLoaded,
    onNodeIdCounterUpdate: handleNodeIdCounterUpdate,
    onSetNextNodeId: handleSetNextNodeId,
  });

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

  const {
    validationResult,
    isValidationOpen,
    setIsValidationOpen,
    sendResult,
    isSendOpen,
    setIsSendOpen,
    backendTerminalOutput,
    isExecuting,
    executionKey,
    runWorkflowValidation,
    handleDownloadJson,
    handleExecuteWorkflow,
  } = useWorkflowExecution({ workflowId, workflowName, nodes, connections });

  const handleCanvasMouseUpWithNodeCreation = (e: React.MouseEvent) => {
    const nodeType = dragState.newNodeType;
    if (nodeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - CANVAS_CONFIG.NODE_WIDTH / 2;
      const y = e.clientY - rect.top - CANVAS_CONFIG.NODE_HEIGHT / 2;
      const newNode = createNode(nodeType, x, y, nextNodeId);
      setNodes([...nodes, newNode]);
      setSelectedNodeId(newNode.id);
      setNextNodeId(nextNodeId + 1);
      setJustCreatedNodeId(newNode.id);
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
      dropTimeoutRef.current = setTimeout(() => setJustCreatedNodeId(null), 180);
    }
    handleCanvasMouseUp(e, dragState);
  };

  const handleDeleteNodeComplete = (nodeId: string) => {
    handleDeleteNode(nodeId);
    handleDeleteNodeWithConnections(nodeId, selectedNodeId, setSelectedNodeId);
    if (selectedConnectionId) setSelectedConnectionId(null);
  };

  const handleDuplicateNodeComplete = (nodeId: string) => {
    handleDuplicateNode(nodeId, `node-${nextNodeId}`);
    setNextNodeId(nextNodeId + 1);
  };

  useEffect(() => {
    return () => {
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!dragState.isDragging || !dragState.newNodeType) return;

    const handleWindowMouseMove = (event: MouseEvent) => {
      setDragState((prev) => {
        if (!prev.isDragging || !prev.newNodeType) return prev;
        return { ...prev, cursorPosition: { x: event.clientX, y: event.clientY } };
      });
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => window.removeEventListener("mousemove", handleWindowMouseMove);
  }, [dragState.isDragging, dragState.newNodeType, setDragState]);

  const incomingNodeOptions = getIncomingNodeOptions(selectedNode, nodes, connections);

  const canvasCursor = dragState.isDragging
    ? "grabbing"
    : dragState.isConnecting
      ? "crosshair"
      : "default";

  return (
    <div className="canvas-layout">
      {/* Panel izquierdo - Export + Paleta de nodos */}
      <div className="canvas-side canvas-side-offset">
        <aside className="canvas-panel">
          <h3 className="panel-title">Arrastrar nodos</h3>
          <NodePalette dragState={dragState} onDragStart={handleNodeTypeDragStart} />
        </aside>

        <aside className="canvas-panel canvas-panel-compact">
          <h3 className="panel-title">Exportar JSON</h3>
          <div className="panel-actions">
            <button className="btn-primary" onClick={handleDownloadJson}>
              Descargar
            </button>
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
          style={{ cursor: canvasCursor }}
        >
          <div
            className="canvas-grid"
            style={{
              position: "relative",
              width: CANVAS_CONFIG.BASE_CANVAS_WIDTH,
              height: CANVAS_CONFIG.BASE_CANVAS_HEIGHT,
            }}
          >
            <CanvasConnectionsLayer
              connections={connections}
              nodes={nodes}
              dragState={dragState}
              selectedConnectionId={selectedConnectionId}
              onSelectConnection={(id) => {
                setSelectedConnectionId(id);
                setSelectedNodeId(null);
              }}
            />

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
                  dragState.isConnecting && dragState.connectionStart !== node.id
                }
                isConnectionSource={dragState.connectionStart === node.id}
              />
            ))}

            <ExecutionLayer
              connections={connections}
              nodes={nodes}
              isExecuting={isExecuting}
              executionKey={executionKey}
            />
          </div>
        </div>
      </section>

      {/* Panel derecho - Detalles del nodo */}
      <NodeDetailPanel
        selectedNode={selectedNode}
        selectedConnectionId={selectedConnectionId}
        connections={connections}
        onOpenConfig={handleOpenConfig}
        onDuplicate={handleDuplicateNodeComplete}
        onDelete={handleDeleteNodeComplete}
        onDeleteConnection={handleDeleteConnection}
        onDeselectConnection={() => setSelectedConnectionId(null)}
        onExecute={handleExecuteWorkflow}
        onValidate={runWorkflowValidation}
      />

      {/* Panel de configuración */}
      <NodeConfigPanel
        node={selectedNode}
        isOpen={isConfigPanelOpen}
        onClose={handleCloseConfig}
        onSave={handleSaveConfig}
        incomingNodeOptions={incomingNodeOptions}
      />

      <DragPreview dragState={dragState} />

      <StatusModal
        isOpen={isValidationOpen && validationResult.status !== "idle"}
        title="Validacion de workflow"
        status={validationResult.status === "idle" ? undefined : validationResult.status}
        message={
          validationResult.status === "ok" ? validationResult.messages[0] : undefined
        }
        introText={
          validationResult.status === "error"
            ? "Se encontraron los siguientes errores:"
            : undefined
        }
        messages={
          validationResult.status === "error" ? validationResult.messages : undefined
        }
        onClose={() => setIsValidationOpen(false)}
      />

      <StatusModal
        isOpen={isSendOpen && sendResult.status !== "idle"}
        title="Envio realizado"
        status={sendResult.status === "idle" ? undefined : sendResult.status}
        message={sendResult.message}
        onClose={() => setIsSendOpen(false)}
      >
        <div className="form-group" style={{ marginTop: "14px" }}>
          <label className="form-label">Terminal de salida</label>
          <textarea
            className="form-textarea"
            value={backendTerminalOutput}
            readOnly
            rows={10}
          />
        </div>
      </StatusModal>
    </div>
  );
}
