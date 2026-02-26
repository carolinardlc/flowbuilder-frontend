import type { Connection, WorkflowNodeData } from "../types";
import type { ExportNode, ExportWorkflow } from "./serializeWorkflow";

type ParseWorkflowImportResult =
  | { ok: true; workflow: ExportWorkflow; warning?: string }
  | { ok: false; error: string };

// ──────────────────────────── guards ────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isNodeType = (value: unknown): value is ExportNode["type"] => {
  return (
    value === "START" ||
    value === "COMMAND" ||
    value === "HTTP" ||
    value === "CONDITIONAL" ||
    value === "END"
  );
};

// ──────────────────────── ExportNode builders ────────────────────────

const toStartNode = (id: string, name: string): ExportNode => ({
  id,
  name,
  type: "START",
});

const toCommandNode = (
  id: string,
  name: string,
  value: Record<string, unknown>,
): ExportNode => ({
  id,
  name,
  type: "COMMAND",
  command: typeof value.command === "string" ? value.command : "",
});

const parseHttpNumericField = (raw: unknown): number | undefined =>
  typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;

const toHttpNode = (
  id: string,
  name: string,
  value: Record<string, unknown>,
): ExportNode => ({
  id,
  name,
  type: "HTTP",
  url: typeof value.url === "string" ? value.url : "",
  method: value.method === "POST" ? "POST" : "GET",
  politica: value.politica === "CONTINUE" ? "CONTINUE" : "STOP",
  timeout: parseHttpNumericField(value.timeout),
  attempts: parseHttpNumericField(value.attempts),
});

const toConditionalNode = (
  id: string,
  name: string,
  value: Record<string, unknown>,
): ExportNode => ({
  id,
  name,
  type: "CONDITIONAL",
  target: typeof value.target === "string" ? value.target : undefined,
});

const toEndNode = (
  id: string,
  name: string,
  value: Record<string, unknown>,
): ExportNode => ({
  id,
  name,
  type: "END",
  outputType: typeof value.outputType === "string" ? value.outputType : undefined,
  message: typeof value.message === "string" ? value.message : undefined,
});

type NodeBuilder = (
  id: string,
  name: string,
  value: Record<string, unknown>,
) => ExportNode;

const NODE_BUILDERS: Record<ExportNode["type"], NodeBuilder> = {
  START: (id, name) => toStartNode(id, name),
  COMMAND: toCommandNode,
  HTTP: toHttpNode,
  CONDITIONAL: toConditionalNode,
  END: toEndNode,
};

const toNode = (value: unknown): ExportNode | null => {
  if (!isRecord(value)) return null;
  const { id, name, type } = value;
  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof name !== "string" ||
    !isNodeType(type)
  ) {
    return null;
  }
  return NODE_BUILDERS[type](String(id), name, value);
};

// ─────────────────────── graph / layout ─────────────────────────

const buildGraph = (
  nodes: ExportNode[],
  connections: ExportWorkflow["connections"],
) => {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();

  nodes.forEach((node) => {
    outgoing.set(node.id, []);
    incoming.set(node.id, 0);
  });

  connections.forEach((connection) => {
    if (!outgoing.has(connection.fromNodeId) || !incoming.has(connection.toNodeId)) {
      return;
    }
    outgoing.get(connection.fromNodeId)?.push(connection.toNodeId);
    incoming.set(connection.toNodeId, (incoming.get(connection.toNodeId) ?? 0) + 1);
  });

  return { outgoing, incoming };
};

const findRoots = (
  nodes: ExportNode[],
  incoming: Map<string, number>,
): string[] => {
  const startIds = nodes.filter((n) => n.type === "START").map((n) => n.id);
  if (startIds.length > 0) return startIds;
  return nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id);
};

const runBFS = (
  roots: string[],
  outgoing: Map<string, string[]>,
): Map<string, number> => {
  const levels = new Map<string, number>();
  const queue: string[] = [];

  roots.forEach((id) => {
    levels.set(id, 0);
    queue.push(id);
  });

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const currentLevel = levels.get(current) ?? 0;
    (outgoing.get(current) ?? []).forEach((next) => {
      const nextLevel = currentLevel + 1;
      const existing = levels.get(next);
      if (existing === undefined || nextLevel > existing) {
        levels.set(next, nextLevel);
      }
      if (!queue.includes(next)) queue.push(next);
    });
  }

  return levels;
};

const buildLevels = (
  nodes: ExportNode[],
  connections: ExportWorkflow["connections"],
): Map<string, number> => {
  const { outgoing, incoming } = buildGraph(nodes, connections);
  const roots = findRoots(nodes, incoming);
  const levels = runBFS(roots, outgoing);

  let fallback = Array.from(levels.values()).reduce((m, v) => Math.max(m, v), 0) + 1;
  nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, fallback);
      fallback += 1;
    }
  });

  return levels;
};

// ─────────────────── canvas node converters ─────────────────────

const resolveCanvasPosition = (
  positions: Map<string, { x: number; y: number }>,
  nodeId: string,
  fallbackIndex: number,
) => {
  return positions.get(nodeId) ?? { x: 120 + fallbackIndex * 220, y: 140 };
};

const toCanvasHttpNode = (
  node: Extract<ExportNode, { type: "HTTP" }>,
  position: { x: number; y: number },
): WorkflowNodeData => ({
  id: node.id,
  title: node.name,
  type: "HTTP_REQUEST",
  x: position.x,
  y: position.y,
  config: {
    method: node.method,
    url: node.url ?? "",
    timeoutMs: typeof node.timeout === "number" ? String(node.timeout) : undefined,
    retries: typeof node.attempts === "number" ? String(node.attempts) : undefined,
    errorPolicy: node.politica === "CONTINUE" ? "CONTINUE" : "STOP",
  },
});

const toCanvasCommandNode = (
  node: Extract<ExportNode, { type: "COMMAND" }>,
  position: { x: number; y: number },
): WorkflowNodeData => ({
  id: node.id,
  title: node.name,
  type: "COMMAND",
  x: position.x,
  y: position.y,
  config: { command: node.command },
});

const toCanvasConditionalNode = (
  node: Extract<ExportNode, { type: "CONDITIONAL" }>,
  position: { x: number; y: number },
): WorkflowNodeData => ({
  id: node.id,
  title: node.name,
  type: "CONDITIONAL",
  x: position.x,
  y: position.y,
  config: { sourceNodeId: node.target },
});

const toCanvasEndNode = (
  node: Extract<ExportNode, { type: "END" }>,
  position: { x: number; y: number },
): WorkflowNodeData => ({
  id: node.id,
  title: node.name,
  type: "END",
  x: position.x,
  y: position.y,
  config: {
    outputType:
      node.outputType === "success" ||
      node.outputType === "error" ||
      node.outputType === "notification"
        ? node.outputType
        : undefined,
    message: node.message,
  },
});

const toCanvasStartNode = (
  node: Extract<ExportNode, { type: "START" }>,
  position: { x: number; y: number },
): WorkflowNodeData => ({
  id: node.id,
  title: node.name,
  type: "START",
  x: position.x,
  y: position.y,
});

const toCanvasNode = (
  node: ExportNode,
  position: { x: number; y: number },
): WorkflowNodeData => {
  if (node.type === "HTTP") return toCanvasHttpNode(node, position);
  if (node.type === "COMMAND") return toCanvasCommandNode(node, position);
  if (node.type === "CONDITIONAL") return toCanvasConditionalNode(node, position);
  if (node.type === "END") return toCanvasEndNode(node, position);
  return toCanvasStartNode(node, position);
};

// ─────────────────── parsing / validation ───────────────────────

const parseNodes = (
  rawNodes: unknown[],
): { ok: true; nodes: ExportNode[] } | { ok: false; error: string } => {
  const nodes: ExportNode[] = [];
  for (const rawNode of rawNodes) {
    const node = toNode(rawNode);
    if (!node) return { ok: false, error: "Nodo invalido en el JSON." };
    nodes.push(node);
  }
  return { ok: true, nodes };
};

const parseConnectionItem = (
  raw: unknown,
): ExportWorkflow["connections"][number] | null => {
  if (!isRecord(raw)) return null;
  const { fromNodeId: from, toNodeId: to, condition } = raw;
  if (
    (typeof from !== "string" && typeof from !== "number") ||
    (typeof to !== "string" && typeof to !== "number")
  ) {
    return null;
  }
  return {
    fromNodeId: String(from),
    toNodeId: String(to),
    condition: typeof condition === "boolean" ? condition : true,
  };
};

type ParseConnectionsResult =
  | { ok: true; connections: ExportWorkflow["connections"]; invalidCount: number }
  | { ok: false; error: string };

const parseConnections = (rawConnections: unknown[]): ParseConnectionsResult => {
  const connections: ExportWorkflow["connections"] = [];
  let invalidCount = 0;

  for (const raw of rawConnections) {
    const connection = parseConnectionItem(raw);
    if (!connection) {
      invalidCount += 1;
      continue;
    }
    connections.push(connection);
  }

  if (connections.length === 0 && rawConnections.length > 0) {
    return {
      ok: false,
      error:
        "Conexiones invalidas. Cada conexion debe incluir fromNodeId y toNodeId (mismo formato que POST).",
    };
  }

  return { ok: true, connections, invalidCount };
};

// ─────────────────────── public exports ─────────────────────────

export const parseWorkflowImportData = (
  data: unknown,
): ParseWorkflowImportResult => {
  if (!isRecord(data)) {
    return { ok: false, error: "El archivo debe ser un objeto JSON." };
  }

  const { id, name, nodes: rawNodes, connections: rawConnections } = data;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof name !== "string" ||
    !Array.isArray(rawNodes) ||
    !Array.isArray(rawConnections)
  ) {
    return {
      ok: false,
      error: "Formato invalido. Debe coincidir con el payload del POST /api/workflows/run.",
    };
  }

  const nodesResult = parseNodes(rawNodes);
  if (!nodesResult.ok) return nodesResult;

  const connectionsResult = parseConnections(rawConnections);
  if (!connectionsResult.ok) return connectionsResult;

  const warning =
    connectionsResult.invalidCount > 0
      ? `Se omitieron ${connectionsResult.invalidCount} conexiones invalidas durante la importacion.`
      : undefined;

  return {
    ok: true,
    workflow: {
      id: String(id),
      name,
      nodes: nodesResult.nodes,
      connections: connectionsResult.connections,
    },
    warning,
  };
};

export const parseWorkflowImportJson = (
  rawJson: string,
): ParseWorkflowImportResult => {
  let data: unknown;
  try {
    data = JSON.parse(rawJson.replace(/^\uFEFF/, ""));
  } catch {
    return { ok: false, error: "JSON invalido." };
  }
  return parseWorkflowImportData(data);
};

export const convertWorkflowToCanvasSnapshot = (workflow: ExportWorkflow) => {
  const levels = buildLevels(workflow.nodes, workflow.connections);
  const groups = new Map<number, ExportNode[]>();

  workflow.nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;
    const list = groups.get(level) ?? [];
    list.push(node);
    groups.set(level, list);
  });

  const positions = new Map<string, { x: number; y: number }>();
  Array.from(groups.keys())
    .sort((a, b) => a - b)
    .forEach((level) => {
      (groups.get(level) ?? []).forEach((node, index) => {
        positions.set(node.id, {
          x: 120 + level * 300,
          y: 120 + index * 160,
        });
      });
    });

  const canvasNodes: WorkflowNodeData[] = workflow.nodes.map((node, index) =>
    toCanvasNode(node, resolveCanvasPosition(positions, node.id, index)),
  );

  const nodeById = new Map(canvasNodes.map((node) => [node.id, node]));
  const canvasConnections: Connection[] = workflow.connections
    .filter((c) => nodeById.has(c.fromNodeId) && nodeById.has(c.toNodeId))
    .map((connection, index) => {
      const fromNode = nodeById.get(connection.fromNodeId);
      return {
        id: `c-import-${index + 1}`,
        from: connection.fromNodeId,
        to: connection.toNodeId,
        fromOffsetY:
          fromNode?.type === "CONDITIONAL"
            ? connection.condition
              ? 24
              : 56
            : 40,
      };
    });

  return { nodes: canvasNodes, connections: canvasConnections };
};
