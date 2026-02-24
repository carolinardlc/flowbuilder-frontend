"use client";

import { STORAGE_KEYS } from "../workflows/[id]/canvas/constants/storage";
import type {
  Connection,
  WorkflowNodeData,
} from "../workflows/[id]/canvas/types";

export type WorkflowCanvasSnapshot = {
  nodes: WorkflowNodeData[];
  connections: Connection[];
};

export const EMPTY_WORKFLOW_CANVAS_SNAPSHOT: WorkflowCanvasSnapshot = {
  nodes: [],
  connections: [],
};

const isValidNode = (value: unknown): value is WorkflowNodeData => {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<WorkflowNodeData>;
  return (
    typeof node.id === "string" &&
    typeof node.title === "string" &&
    typeof node.type === "string" &&
    typeof node.x === "number" &&
    typeof node.y === "number"
  );
};

const isValidConnection = (value: unknown): value is Connection => {
  if (!value || typeof value !== "object") return false;
  const connection = value as Partial<Connection>;
  return (
    typeof connection.id === "string" &&
    typeof connection.from === "string" &&
    typeof connection.to === "string"
  );
};

export const sanitizeWorkflowCanvasSnapshot = (
  snapshot: Partial<WorkflowCanvasSnapshot>,
): WorkflowCanvasSnapshot => {
  const nodes = Array.isArray(snapshot.nodes)
    ? snapshot.nodes.filter(isValidNode)
    : [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const connections = Array.isArray(snapshot.connections)
    ? snapshot.connections.filter(
        (connection) =>
          isValidConnection(connection) &&
          nodeIds.has(connection.from) &&
          nodeIds.has(connection.to),
      )
    : [];

  return { nodes, connections };
};

export const loadWorkflowCanvasSnapshot = (
  workflowId: string,
): WorkflowCanvasSnapshot | null => {
  if (typeof window === "undefined") return null;

  const storageKey = STORAGE_KEYS.WORKFLOW_CANVAS(workflowId);
  if (!storageKey) return null;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkflowCanvasSnapshot>;
    return sanitizeWorkflowCanvasSnapshot(parsed);
  } catch (error) {
    console.error("Error loading canvas snapshot from localStorage:", error);
    return null;
  }
};

export const saveWorkflowCanvasSnapshot = (
  workflowId: string,
  snapshot: WorkflowCanvasSnapshot,
) => {
  if (typeof window === "undefined") return;

  const storageKey = STORAGE_KEYS.WORKFLOW_CANVAS(workflowId);
  if (!storageKey) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch (error) {
    console.error("Error saving canvas snapshot to localStorage:", error);
  }
};

export const removeWorkflowCanvasSnapshot = (workflowId: string) => {
  if (typeof window === "undefined") return;

  const storageKey = STORAGE_KEYS.WORKFLOW_CANVAS(workflowId);
  if (!storageKey) return;

  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Error removing canvas snapshot from localStorage:", error);
  }
};
