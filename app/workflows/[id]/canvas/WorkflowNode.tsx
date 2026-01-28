import type { ReactNode } from "react";

export type WorkflowNodeType = "START" | "ACTION" | "CONDITIONAL" | "END";

export type WorkflowNodeData = {
  id: string;
  title: string;
  type: WorkflowNodeType;
  x: number;
  y: number;
};

type WorkflowNodeProps = {
  node: WorkflowNodeData;
  selected: boolean;
  onSelect: (id: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onConnectionClick?: () => void;
  isConnectionTarget?: boolean;
  children?: ReactNode;
};

const typeClassMap: Record<WorkflowNodeType, string> = {
  START: "node node-start",
  ACTION: "node node-action",
  CONDITIONAL: "node node-conditional",
  END: "node node-end",
};

export default function WorkflowNode({
  node,
  selected,
  onSelect,
  onMouseDown,
  onConnectionClick,
  isConnectionTarget,
}: WorkflowNodeProps) {
  return (
    <div className="absolute">
      <button
        type="button"
        className={`${typeClassMap[node.type]} ${
          selected ? "node-selected" : ""
        } ${isConnectionTarget ? "node-connection-target" : ""}`}
        style={{ left: node.x, top: node.y }}
        onClick={() =>
          onConnectionClick ? onConnectionClick() : onSelect(node.id)
        }
        onMouseDown={onMouseDown}
      >
        <span className="node-title">{node.title}</span>
        <span className="node-type">{node.type}</span>
      </button>
    </div>
  );
}
