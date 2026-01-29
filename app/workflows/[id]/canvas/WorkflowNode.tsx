import type { ReactNode } from "react";
import { getNodeClass } from "./constants/nodeTypes";
import type { WorkflowNodeData, WorkflowNodeType } from "./types";

type WorkflowNodeProps = {
  node: WorkflowNodeData;
  selected: boolean;
  onSelect: (id: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onConnectionClick?: () => void;
  isConnectionTarget?: boolean;
  children?: ReactNode;
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
}: WorkflowNodeProps) {
  return (
    <div
      className="node-wrapper"
      style={{ position: "absolute", left: node.x, top: node.y }}
    >
      <button
        type="button"
        className={`node node-${node.type.toLowerCase()} ${
          selected ? "node-selected" : ""
        } ${isConnectionTarget ? "node-connection-target" : ""}`}
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
