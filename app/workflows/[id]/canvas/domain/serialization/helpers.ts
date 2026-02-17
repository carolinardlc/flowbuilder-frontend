import type { Connection, WorkflowNodeData, WorkflowNodeType } from "../../types";

export const mapNodeTypeToBackend = (
  type: WorkflowNodeType,
): "START" | "COMMAND" | "HTTP" | "CONDITIONAL" | "END" => {
  if (type === "COMMAND") return "COMMAND";
  if (type === "HTTP_REQUEST") return "HTTP";
  if (type === "START") return "START";
  if (type === "CONDITIONAL") return "CONDITIONAL";
  return "END";
};

export const resolveConnectionCondition = (
  connection: Connection,
  fromNode?: WorkflowNodeData,
): boolean => {
  if (fromNode?.type !== "CONDITIONAL") return true;
  const offset = connection.fromOffsetY ?? 40;
  return offset <= 40;
};

// Normaliza el grafo para evitar serializar referencias huérfanas.
export const getSafeConnections = (
  nodes: WorkflowNodeData[],
  connections: Connection[],
): Connection[] => {
  const validNodeIds = new Set(nodes.map((node) => node.id));
  return connections.filter(
    (connection) =>
      typeof connection.from === "string" &&
      typeof connection.to === "string" &&
      validNodeIds.has(connection.from) &&
      validNodeIds.has(connection.to),
  );
};

// Orden estable para mantener un payload más legible desde START.
export const orderNodesByConnections = (
  nodes: WorkflowNodeData[],
  connections: Connection[],
): WorkflowNodeData[] => {
  const startNode = nodes.find((n) => n.type === "START");
  if (!startNode) return nodes;

  const outgoing = new Map<string, string[]>();
  connections.forEach((connection) => {
    const list = outgoing.get(connection.from) ?? [];
    list.push(connection.to);
    outgoing.set(connection.from, list);
  });

  const visited = new Set<string>();
  const orderedIds: string[] = [];
  const stack: string[] = [startNode.id];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    orderedIds.push(currentId);

    const nextIds = outgoing.get(currentId) ?? [];
    for (let i = nextIds.length - 1; i >= 0; i -= 1) {
      const nextId = nextIds[i];
      if (!visited.has(nextId)) stack.push(nextId);
    }
  }

  const orderedNodes = orderedIds
    .map((id) => nodes.find((node) => node.id === id))
    .filter((node): node is NonNullable<typeof node> => !!node);

  const remainingNodes = nodes.filter((node) => !visited.has(node.id));
  return [...orderedNodes, ...remainingNodes];
};
