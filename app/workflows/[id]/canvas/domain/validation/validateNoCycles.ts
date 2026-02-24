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

const buildNodesById = (nodes: Node[]) => new Map(nodes.map((node) => [node.id, node]));

const normalizeCycleForKey = (cycleIds: string[]): string => {
  const cycleWithoutClosure =
    cycleIds.length > 1 && cycleIds[0] === cycleIds[cycleIds.length - 1]
      ? cycleIds.slice(0, -1)
      : cycleIds;

  if (cycleWithoutClosure.length === 0) {
    return "";
  }

  let best = cycleWithoutClosure;
  for (let i = 1; i < cycleWithoutClosure.length; i += 1) {
    const rotated = [
      ...cycleWithoutClosure.slice(i),
      ...cycleWithoutClosure.slice(0, i),
    ];
    if (rotated.join("->") < best.join("->")) {
      best = rotated;
    }
  }

  return best.join("->");
};

const formatCycle = (cycleIds: string[], nodesById: Map<string, Node>) =>
  cycleIds.map((nodeId) => nodesById.get(nodeId)?.title ?? nodeId).join(" -> ");

type DfsState = {
  visited: Set<string>;
  inStack: Set<string>;
  path: string[];
  pathIndexByNode: Map<string, number>;
  foundCycles: Map<string, string[]>;
};

const buildCycleFromPath = (
  nextId: string,
  currentNodeId: string,
  state: DfsState,
): string[] => {
  const cycleStartIndex = state.pathIndexByNode.get(nextId);
  if (cycleStartIndex === undefined) {
    return [currentNodeId, nextId];
  }
  return [...state.path.slice(cycleStartIndex), nextId];
};

const registerCycle = (
  cycleIds: string[],
  state: DfsState,
) => {
  const cycleKey = normalizeCycleForKey(cycleIds);
  if (!cycleKey || state.foundCycles.has(cycleKey)) return;
  state.foundCycles.set(cycleKey, cycleIds);
};

const leaveNode = (nodeId: string, state: DfsState) => {
  state.path.pop();
  state.pathIndexByNode.delete(nodeId);
  state.inStack.delete(nodeId);
};

const depthFirstSearch = (
  nodeId: string,
  adjacency: Map<string, string[]>,
  state: DfsState,
) => {
  state.visited.add(nodeId);
  state.inStack.add(nodeId);
  state.pathIndexByNode.set(nodeId, state.path.length);
  state.path.push(nodeId);

  const neighbors = adjacency.get(nodeId) ?? [];
  for (const nextId of neighbors) {
    if (!state.visited.has(nextId)) {
      depthFirstSearch(nextId, adjacency, state);
      continue;
    }

    if (!state.inStack.has(nextId)) continue;

    const cycleIds = buildCycleFromPath(nextId, nodeId, state);
    registerCycle(cycleIds, state);
  }

  leaveNode(nodeId, state);
};

const detectCycles = (
  nodes: Node[],
  adjacency: Map<string, string[]>,
): string[][] => {
  const state: DfsState = {
    visited: new Set<string>(),
    inStack: new Set<string>(),
    path: [],
    pathIndexByNode: new Map<string, number>(),
    foundCycles: new Map<string, string[]>(),
  };

  for (const node of nodes) {
    if (state.visited.has(node.id)) continue;
    depthFirstSearch(node.id, adjacency, state);
  }

  return Array.from(state.foundCycles.values());
};

const toCycleValidationError = (
  cycleIdsList: string[][],
  nodesById: Map<string, Node>,
): ValidationError[] => {
  if (cycleIdsList.length === 0) return [];

  const cycleMessages = cycleIdsList.map((cycleIds) =>
    formatCycle(cycleIds, nodesById),
  );

  return [
    {
      code: "CYCLE_DETECTED",
      message: `Se detectaron bucles: ${cycleMessages.join(", ")}.`,
    },
  ];
};

export function validateNoCycles(
  nodes: Node[],
  connections: Connection[],
): ValidationError[] {
  const adjacency = buildAdjacency(nodes, connections);
  const nodesById = buildNodesById(nodes);
  const cycleIdsList = detectCycles(nodes, adjacency);
  return toCycleValidationError(cycleIdsList, nodesById);
}
