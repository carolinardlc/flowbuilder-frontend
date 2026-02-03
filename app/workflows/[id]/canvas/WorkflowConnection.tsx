import type { WorkflowNodeData } from "./WorkflowNode";
import { CANVAS_CONFIG } from "./constants/storage";

type WorkflowConnectionProps = {
  id: string;
  from: WorkflowNodeData;
  to: WorkflowNodeData;
  fromOffsetY?: number;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
};

export default function WorkflowConnection({
  id,
  from,
  to,
  fromOffsetY,
  isSelected = false,
  onSelect,
}: WorkflowConnectionProps) {
  const startX = from.x + 180;
  const startY = from.y + (fromOffsetY ?? CANVAS_CONFIG.CONNECTION_OFFSET_Y);
  const endX = to.x;
  const endY = to.y + 40;
  const controlX = (startX + endX) / 2;

  const path = `
    M ${startX} ${startY}
    C ${controlX} ${startY},
      ${controlX} ${endY},
      ${endX} ${endY}
  `;

  return (
    <path
      d={path}
      className={`connection-path ${isSelected ? "connection-selected" : ""}`}
      markerEnd="url(#arrowhead)"
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(id);
      }}
    />
  );
}
