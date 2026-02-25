"use client";

import type { DragState } from "../types";
import { NODE_TYPE_ARRAY } from "../constants/nodeTypes";

type NodePaletteProps = {
  dragState: DragState;
  onDragStart: (
    type: (typeof NODE_TYPE_ARRAY)[number]["type"],
    e: React.MouseEvent,
  ) => void;
};

export default function NodePalette({ dragState, onDragStart }: NodePaletteProps) {
  return (
    <div className="node-palette">
      {NODE_TYPE_ARRAY.map((nodeType) => (
        <div
          key={nodeType.type}
          className={`draggable-node node node-${nodeType.type.toLowerCase()}${
            dragState.isDragging && dragState.newNodeType === nodeType.type
              ? " draggable-node-active"
              : ""
          }`}
          onMouseDown={(e) => onDragStart(nodeType.type, e)}
          style={{ cursor: "grab", marginBottom: "8px" }}
        >
          <span className="node-title" style={{ fontSize: "0.9rem" }}>
            {nodeType.label}
          </span>
        </div>
      ))}
    </div>
  );
}
