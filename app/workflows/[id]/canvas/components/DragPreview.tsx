"use client";

import { NODE_TYPES } from "../constants/nodeTypes";
import { CANVAS_CONFIG } from "../constants/storage";
import type { DragState } from "../types";

type DragPreviewProps = {
  dragState: DragState;
};

const isNodeTypeKey = (
  type: DragState["newNodeType"],
): type is keyof typeof NODE_TYPES => !!type && type in NODE_TYPES;

export default function DragPreview({ dragState }: DragPreviewProps) {
  if (
    !dragState.isDragging ||
    !isNodeTypeKey(dragState.newNodeType) ||
    !dragState.cursorPosition
  ) {
    return null;
  }

  return (
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
  );
}
