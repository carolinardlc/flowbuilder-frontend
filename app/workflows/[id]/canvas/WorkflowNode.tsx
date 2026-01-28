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
}: WorkflowNodeProps) {
  return (
    <button
      type="button"
      className={`${typeClassMap[node.type]} ${
        selected ? "node-selected" : ""
      }`}
      style={{ left: node.x, top: node.y }}
      onClick={() => onSelect(node.id)}
    >
      <span className="node-title">{node.title}</span>
      <span className="node-type">{node.type}</span>
    </button>
  );
}
