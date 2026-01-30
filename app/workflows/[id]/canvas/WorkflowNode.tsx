import { getNodeClass } from "./constants/nodeTypes";
import type { WorkflowNodeData, WorkflowNodeType } from "./types";

type WorkflowNodeProps = {
  node: WorkflowNodeData;
  selected: boolean;
  onSelect: (id: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onConnectionClick?: () => void;
  isConnectionTarget?: boolean;
  onStartConnection?: (id: string) => void;
  onCompleteConnection?: (id: string) => void;
  isConnectionSource?: boolean;
};

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
  onMouseDown,
  onConnectionClick,
  isConnectionTarget,
  onStartConnection,
  onCompleteConnection,
  isConnectionSource,
}: WorkflowNodeProps) {
  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection?.(node.id);
  };

  const handleCompleteConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompleteConnection?.(node.id);
  };

  const buttonClasses = [
    getNodeClass(node.type),
    selected ? "node-selected" : "",
    isConnectionTarget ? "node-connection-target" : "",
    isConnectionSource ? "node-connection-source" : "",
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
        onClick={() =>
          onConnectionClick ? onConnectionClick() : onSelect(node.id)
        }
        onMouseDown={(e) => {
          if (onMouseDown) {
            e.preventDefault();
            e.stopPropagation();
            onMouseDown(e);
          }
        }}
      >
        <span className="node-title">{node.title}</span>
        <span className="node-type">{node.type}</span>
      </button>
      <div
        className="node-handle node-handle-in"
        onMouseUp={handleCompleteConnection}
        title="Soltar conexión aquí"
      />
      <div
        className="node-handle node-handle-out"
        onMouseDown={handleStartConnection}
        title="Arrastrar para conectar"
      />
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
    </div>
  );
}

// Exportar tipos para uso en otros componentes
export type { WorkflowNodeData, WorkflowNodeType };
