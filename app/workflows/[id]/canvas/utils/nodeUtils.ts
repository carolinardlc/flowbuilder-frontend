/**
 * Utilidades para manejo de nodos
 */

import type { WorkflowNodeData, WorkflowNodeType } from "../types";
import { NODE_TYPES } from "../constants/nodeTypes";
import { CANVAS_CONFIG } from "../constants/storage";

/**
 * Crea un nuevo nodo con valores por defecto
 */
export const createNode = (
  type: WorkflowNodeType,
  x: number,
  y: number,
  idCounter: number,
): WorkflowNodeData => {
  const nodeTypeInfo =
    type in NODE_TYPES ? NODE_TYPES[type as keyof typeof NODE_TYPES] : undefined;
  const label = nodeTypeInfo?.label ?? type;
  return {
    id: `node-${idCounter}`,
    title: `${label}`,
    type,
    x: Math.max(0, x),
    y: Math.max(0, y),
  };
};

/**
 * Verifica si un nodo existe en el array
 */
export const nodeExists = (
  nodeId: string,
  nodes: WorkflowNodeData[],
): boolean => {
  return nodes.some((node) => node.id === nodeId);
};

/**
 * Encuentra un nodo por su ID
 */
export const findNode = (
  nodeId: string,
  nodes: WorkflowNodeData[],
): WorkflowNodeData | null => {
  return nodes.find((node) => node.id === nodeId) ?? null;
};

/**
 * Obtiene información de un tipo de nodo
 */
export const getNodeTypeInfo = (type: WorkflowNodeType) => {
  if (!(type in NODE_TYPES)) return undefined;
  return NODE_TYPES[type as keyof typeof NODE_TYPES];
};

/**
 * Calcula el siguiente ID disponible para un nuevo nodo
 */
export const calculateNextNodeId = (nodes: WorkflowNodeData[]): number => {
  let maxNum = 0;
  for (const node of nodes) {
    const num = Number(String(node.id).replace("node-", ""));
    if (Number.isFinite(num) && num > maxNum) maxNum = num;
  }
  return maxNum + 1;
};

/**
 * Construye el path SVG de una conexión entre dos nodos
 */
export const buildConnectionPath = (
  fromNodeId: string,
  toNodeId: string,
  nodes: WorkflowNodeData[],
  fromOffsetY?: number,
): string | null => {
  const from = nodes.find((node) => node.id === fromNodeId);
  const to = nodes.find((node) => node.id === toNodeId);
  if (!from || !to) return null;

  const startX = from.x + CANVAS_CONFIG.CONNECTION_OFFSET_X;
  const startY = from.y + (fromOffsetY ?? CANVAS_CONFIG.CONNECTION_OFFSET_Y);
  const endX = to.x;
  const endY = to.y + CANVAS_CONFIG.CONNECTION_OFFSET_Y;
  const controlX = (startX + endX) / 2;

  return `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
};

/**
 * Valida si una conexión es válida (no existe y no es auto-conexión)
 */
export const isValidConnection = (
  fromId: string,
  toId: string,
  existingConnections: { from: string; to: string }[],
): boolean => {
  if (fromId === toId) return false;

  return !existingConnections.some(
    (connection) => connection.from === fromId && connection.to === toId,
  );
};
