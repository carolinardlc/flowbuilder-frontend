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
  BASE_CANVAS_WIDTH: 1600,
  BASE_CANVAS_HEIGHT: 800,
  CANVAS_WIDTH_RATIO: 0.8,
  CANVAS_HEIGHT_RATIO: 0.8,
  MIN_CANVAS_WIDTH: 960,
  MIN_CANVAS_HEIGHT: 600,
  CONNECTION_OFFSET_X: 180,
  CONNECTION_OFFSET_Y: 40,
} as const;
