import type { Connection } from "../../types";
import type { Node, ValidationError } from "./types";

const buildAdjacency = (nodes: Node[], connections: Connection[]) => {
  const adjacency = new Map<string, string[]>();
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const connection of connections) {
    if (!nodeIds.has(connection.from) || !nodeIds.has(connection.to)) {
      continue;
    }
    const targets = adjacency.get(connection.from) ?? [];
    targets.push(connection.to);
    adjacency.set(connection.from, targets);
  }

  return adjacency;
};

export function validateReachability(
  nodes: Node[],
  connections: Connection[],
): ValidationError[] {
  const startNode = nodes.find((node) => node.type === "START");
  if (!startNode) {
    return [];
  }

  const adjacency = buildAdjacency(nodes, connections);
  const reachable = new Set<string>();
  const stack = [startNode.id];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || reachable.has(currentId)) {
      continue;
    }

    reachable.add(currentId);
    const neighbors = adjacency.get(currentId) ?? [];
    for (const nextId of neighbors) {
      if (!reachable.has(nextId)) {
        stack.push(nextId);
      }
    }
  }

  const unreachableNodes = nodes.filter((node) => !reachable.has(node.id));
  if (unreachableNodes.length === 0) {
    return [];
  }

  return [
    {
      code: "UNREACHABLE_NODE",
      message: `Hay nodos no alcanzables desde Inicio: ${unreachableNodes
        .map((node) => node.title)
        .join(", ")}.`,
    },
  ];
}
