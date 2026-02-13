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

const formatCycle = (cycleIds: string[], nodesById: Map<string, Node>) => {
  return cycleIds
    .map((nodeId) => nodesById.get(nodeId)?.title ?? nodeId)
    .join(" -> ");
};

export function validateNoCycles(
  nodes: Node[],
  connections: Connection[],
): ValidationError[] {
  const adjacency = buildAdjacency(nodes, connections);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];
  const cycles = new Set<string>();

  const dfs = (nodeId: string) => {
    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const nextId of neighbors) {
      if (!visited.has(nextId)) {
        dfs(nextId);
        continue;
      }

      if (!inStack.has(nextId)) {
        continue;
      }

      const cycleStartIndex = path.indexOf(nextId);
      const cycleIds =
        cycleStartIndex >= 0
          ? [...path.slice(cycleStartIndex), nextId]
          : [nodeId, nextId];
      cycles.add(formatCycle(cycleIds, nodesById));
    }

    path.pop();
    inStack.delete(nodeId);
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  if (cycles.size === 0) {
    return [];
  }

  return [
    {
      code: "CYCLE_DETECTED",
      message: `Se detectaron bucles: ${Array.from(cycles).join(", ")}.`,
    },
  ];
}
