import type { WorkflowNodeData } from "./WorkflowNode";

type WorkflowConnectionProps = {
  from: WorkflowNodeData;
  to: WorkflowNodeData;
};

export default function WorkflowConnection({
  from,
  to,
}: WorkflowConnectionProps) {
  const startX = from.x + 180;
  const startY = from.y + 40;
  const endX = to.x;
  const endY = to.y + 40;
  const controlX = (startX + endX) / 2;

  const path = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;

  return (
    <path
      d={path}
      className="connection-path"
      markerEnd="url(#arrowhead)"
    />
  );
}
