import type { Node, ValidationError } from "./types";

export function validateStartNode(nodes: Node[]): ValidationError[] {
  const startNodes = nodes.filter((node) => node.type === "START");

  if (startNodes.length === 0) {
    return [
      {
        code: "START_MISSING",
        message: "Falta el nodo Inicio.",
      },
    ];
  }

  if (startNodes.length > 1) {
    return [
      {
        code: "START_MULTIPLE",
        message: "Hay más de un nodo Inicio.",
      },
    ];
  }

  return [];
}
