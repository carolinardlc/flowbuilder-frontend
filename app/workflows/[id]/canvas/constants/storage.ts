/**
 * Constantes y utilidades para localStorage
 */

export const STORAGE_KEYS = {
  WORKFLOW_CANVAS: (workflowId: string): string => {
    const id = String(workflowId ?? "").trim();
    return id ? `workflow-canvas:${id}` : "";
  },
} as const;
export const DEFAULT_DRAG_STATE = {
  isDragging: false,
  draggedNode: null,
  dragOffset: { x: 0, y: 0 },
  newNodeType: null,
  isConnecting: false,
  connectionStart: null,
  tempConnection: null,
} as const;

export const CANVAS_CONFIG = {
  NODE_WIDTH: 180,
  NODE_HEIGHT: 80,
  GRID_SIZE: 28,
  CANVAS_WIDTH: 1600,
  CANVAS_HEIGHT: 800,
  CONNECTION_OFFSET_X: 180,
  CONNECTION_OFFSET_Y: 40,
} as const;
