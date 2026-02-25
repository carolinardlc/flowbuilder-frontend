/**
 * Constantes para tipos de nodos del workflow
 */

import type { WorkflowNodeType } from "../types";

export const NODE_TYPES = {
  START: {
    type: "START" as WorkflowNodeType,
    color: "#62c9a9",
    bgColor: "rgba(98, 201, 169, 0.2)",
    icon: "🚀",
    label: "Inicio",
    description: "Punto de inicio del workflow",
  },
  COMMAND: {
    type: "COMMAND" as WorkflowNodeType,
    color: "#f5b6a5",
    bgColor: "rgba(245, 182, 165, 0.25)",
    icon: "⚡",
    label: "Command",
    description: "Ejecuta un comando local",
  },
  CONDITIONAL: {
    type: "CONDITIONAL" as WorkflowNodeType,
    color: "#9e8bff",
    bgColor: "rgba(158, 139, 255, 0.2)",
    icon: "🔀",
    label: "Condicional",
    description: "Evalúa condiciones y bifurca el flujo",
  },
  HTTP_REQUEST: {
    type: "HTTP_REQUEST" as WorkflowNodeType,
    color: "#f5b6a5",
    bgColor: "rgba(245, 182, 165, 0.2)",
    icon: "🌐",
    label: "HTTP Request",
    description: "Solicitud HTTP externa",
  },
} as const;

export const NODE_TYPE_ARRAY = Object.values(NODE_TYPES);

export const getNodeClass = (type: WorkflowNodeType): string => {
  return `node node-${type.toLowerCase()}`;
};

export const getNodeTypeBadgeClass = (type: WorkflowNodeType): string => {
  return `node-type-badge node-${type.toLowerCase()}`;
};
