import type { Node, ValidationError } from "./types";

const isNotEmpty = (value?: string) => {
  return typeof value === "string" && value.trim().length > 0;
};

export function validateNodeConfig(node: Node): ValidationError[] {
  if (node.type === "COMMAND") {
    if (!isNotEmpty(node.config?.command)) {
      return [
        {
          code: "NODE_CONFIG_INVALID",
          nodeId: node.id,
          message: `Config incompleta en Command: ${node.title}.`,
        },
      ];
    }
    return [];
  }

  if (node.type === "HTTP_REQUEST") {
    if (!isNotEmpty(node.config?.method) || !isNotEmpty(node.config?.index)) {
      return [
        {
          code: "NODE_CONFIG_INVALID",
          nodeId: node.id,
          message: `Config incompleta en HTTP Request: ${node.title}.`,
        },
      ];
    }
    return [];
  }

  if (node.type === "CONDITIONAL") {
    if (!isNotEmpty(node.config?.sourceNodeId)) {
      return [
        {
          code: "NODE_CONFIG_INVALID",
          nodeId: node.id,
          message: `Config incompleta en Condicional: ${node.title}.`,
        },
      ];
    }
    return [];
  }

  if (node.type === "END") {
    if (
      !isNotEmpty(node.config?.outputType) ||
      !isNotEmpty(node.config?.message)
    ) {
      return [
        {
          code: "NODE_CONFIG_INVALID",
          nodeId: node.id,
          message: `Config incompleta en Fin: ${node.title}.`,
        },
      ];
    }
  }

  return [];
}
