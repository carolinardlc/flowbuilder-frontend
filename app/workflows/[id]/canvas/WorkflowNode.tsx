import { getNodeClass } from "./constants/nodeTypes";
import type { WorkflowNodeData, WorkflowNodeType } from "./types";

type WorkflowNodeProps = {
  node: WorkflowNodeData;
  selected: boolean;
  onSelect: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onConnectionClick?: () => void;
  isConnectionTarget?: boolean;
  onStartConnection?: (id: string, offsetY?: number) => void;
  onCompleteConnection?: (id: string) => void;
  isConnectionSource?: boolean;
  readOnly?: boolean;
  isDragging?: boolean;
  isJustCreated?: boolean;
};

type NodeHandlesProps = {
  nodeId: string;
  nodeType: WorkflowNodeType;
  isConnectionTarget: boolean;
  onStartConnection?: (id: string, offsetY?: number) => void;
  onCompleteConnection?: (id: string) => void;
};

function NodeHandles({
  nodeId,
  nodeType,
  isConnectionTarget,
  onStartConnection,
  onCompleteConnection,
}: NodeHandlesProps) {
  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection?.(nodeId);
  };

  const handleStartConnectionTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection?.(nodeId, 24);
  };

  const handleStartConnectionBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection?.(nodeId, 56);
  };

  const handleCompleteConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompleteConnection?.(nodeId);
  };

  return (
    <>
      <div
        className="node-handle node-handle-in"
        onMouseUp={handleCompleteConnection}
        title="Soltar conexión aquí"
      />
      {nodeType === "CONDITIONAL" ? (
        <>
          <div
            className="node-handle node-handle-out node-handle-out-top"
            onMouseDown={handleStartConnectionTop}
            title="Arrastrar para conectar (ruta 1)"
          />
          <span className="node-handle-label node-handle-label-true">TRUE</span>
          <div
            className="node-handle node-handle-out node-handle-out-bottom"
            onMouseDown={handleStartConnectionBottom}
            title="Arrastrar para conectar (ruta 2)"
          />
          <span className="node-handle-label node-handle-label-false">FALSE</span>
        </>
      ) : (
        <div
          className="node-handle node-handle-out"
          onMouseDown={handleStartConnection}
          title="Arrastrar para conectar"
        />
      )}
      {isConnectionTarget && (
        <div
          className="connection-hint"
          style={{
            position: "absolute",
            left: 85,
            top: 15,
            fontSize: "10px",
            color: "#9e8bff",
            pointerEvents: "none",
          }}
        >
          📍
        </div>
      )}
    </>
  );
}

/**
 * Componente visual para un nodo de workflow
 *
 * Renderiza un nodo individual con su apariencia y comportamiento específicos
 * según su tipo (START, ACTION, CONDITIONAL, END)
 */
export default function WorkflowNode({
  node,
  selected,
  onSelect,
  onDoubleClick,
  onMouseDown,
  onConnectionClick,
  isConnectionTarget,
  onStartConnection,
  onCompleteConnection,
  isConnectionSource,
  readOnly = false,
  isDragging = false,
  isJustCreated = false,
}: WorkflowNodeProps) {
  const buttonClasses = [
    getNodeClass(node.type),
    selected ? "node-selected" : "",
    isConnectionTarget ? "node-connection-target" : "",
    isConnectionSource ? "node-connection-source" : "",
    readOnly ? "node-readonly" : "",
    isDragging ? "node-dragging" : "",
    isJustCreated ? "node-drop" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="node-wrapper"
      style={{ position: "absolute", left: node.x, top: node.y }}
    >
      <button
        type="button"
        className={buttonClasses}
        onClick={
          readOnly
            ? undefined
            : () => (onConnectionClick ? onConnectionClick() : onSelect(node.id))
        }
        onMouseDown={(e) => {
          if (onMouseDown && !readOnly) {
            e.preventDefault();
            e.stopPropagation();
            onMouseDown(e);
          }
        }}
        onDoubleClick={(e) => {
          if (!readOnly) {
            e.stopPropagation();
            onDoubleClick?.(node.id);
          }
        }}
        aria-disabled={readOnly}
      >
        <span className="node-title">{node.title}</span>
        <span className="node-type">{node.type}</span>
      </button>
      {!readOnly && (
        <NodeHandles
          nodeId={node.id}
          nodeType={node.type}
          isConnectionTarget={isConnectionTarget ?? false}
          onStartConnection={onStartConnection}
          onCompleteConnection={onCompleteConnection}
        />
      )}
    </div>
  );
}

// Exportar tipos para uso en otros componentes
export type { WorkflowNodeData, WorkflowNodeType };
