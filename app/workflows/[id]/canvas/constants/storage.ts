/**
 * Constantes y utilidades para localStorage
 */

export const STORAGE_KEYS = {
  WORKFLOW_CANVAS: (workflowId: string): string =>
    `workflow-canvas:${String(workflowId ?? "").trim()}`,
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
  BASE_CANVAS_WIDTH: 3200,
  BASE_CANVAS_HEIGHT: 1600,
  CANVAS_WIDTH_RATIO: 0.95,
  CANVAS_HEIGHT_RATIO: 0.95,
  MIN_CANVAS_WIDTH: 2600,
  MIN_CANVAS_HEIGHT: 1450,
  CONNECTION_OFFSET_X: 180,
  CONNECTION_OFFSET_Y: 40,
} as const;
