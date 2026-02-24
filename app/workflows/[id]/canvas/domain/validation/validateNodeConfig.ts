import type { Node, ValidationError } from "./types";

const isNotEmpty = (value?: string) => {
  return typeof value === "string" && value.trim().length > 0;
};

const buildNodeConfigInvalidError = (
  node: Node,
  label: string,
): ValidationError[] => [
  {
    code: "NODE_CONFIG_INVALID",
    nodeId: node.id,
    message: `Config incompleta en ${label}: ${node.title}.`,
  },
];

const validators = {
  COMMAND: (node: Node) =>
    isNotEmpty(node.config?.command)
      ? []
      : buildNodeConfigInvalidError(node, "Command"),
  HTTP_REQUEST: (node: Node) =>
    isNotEmpty(node.config?.method) && isNotEmpty(node.config?.index)
      ? []
      : buildNodeConfigInvalidError(node, "HTTP Request"),
  CONDITIONAL: (node: Node) =>
    isNotEmpty(node.config?.sourceNodeId)
      ? []
      : buildNodeConfigInvalidError(node, "Condicional"),
  END: (node: Node) =>
    isNotEmpty(node.config?.outputType) && isNotEmpty(node.config?.message)
      ? []
      : buildNodeConfigInvalidError(node, "Fin"),
} as const;

export function validateNodeConfig(node: Node): ValidationError[] {
  if (node.type === "START") return [];
  return validators[node.type](node);
}
