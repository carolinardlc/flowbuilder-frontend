/**
 * Utilidades para manejo de nodos
 */

import type { WorkflowNodeData, WorkflowNodeType } from "../types";
import { NODE_TYPES } from "../constants/nodeTypes";

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
  const maxNum =
    nodes
      .map((n) => Number(String(n.id).replace("node-", "")))
      .filter((x) => Number.isFinite(x))
      .reduce((a, b) => Math.max(a, b), 0) || 0;

  return maxNum + 1;
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
