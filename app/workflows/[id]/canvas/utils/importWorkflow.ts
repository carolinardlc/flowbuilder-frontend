import type { Connection, WorkflowNodeData } from "../types";
import type { ExportNode, ExportWorkflow } from "./serializeWorkflow";

type ParseWorkflowImportResult =
  | { ok: true; workflow: ExportWorkflow; warning?: string }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isNodeType = (
  value: unknown,
): value is ExportNode["type"] => {
  return (
    value === "START" ||
    value === "COMMAND" ||
    value === "HTTP" ||
    value === "CONDITIONAL" ||
    value === "END"
  );
};

const toNode = (value: unknown): ExportNode | null => {
  if (!isRecord(value)) return null;

  const id = value.id;
  const name = value.name;
  const type = value.type;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof name !== "string" ||
    !isNodeType(type)
  ) {
    return null;
  }

  if (type === "START") {
    return { id: String(id), name, type: "START" };
  }

  if (type === "COMMAND") {
    return {
      id: String(id),
      name,
      type: "COMMAND",
      command: typeof value.command === "string" ? value.command : "",
    };
  }

  if (type === "HTTP") {
    const method = value.method === "POST" ? "POST" : "GET";
    const timeout =
      typeof value.timeout === "number" && Number.isFinite(value.timeout)
        ? value.timeout
        : undefined;
    const attempts =
      typeof value.attempts === "number" && Number.isFinite(value.attempts)
        ? value.attempts
        : undefined;

    return {
      id: String(id),
      name,
      type: "HTTP",
      url: typeof value.url === "string" ? value.url : "",
      method,
      politica: value.politica === "CONTINUE" ? "CONTINUE" : "STOP",
      timeout,
      attempts,
    };
  }

  if (type === "CONDITIONAL") {
    return {
      id: String(id),
      name,
      type: "CONDITIONAL",
      target: typeof value.target === "string" ? value.target : undefined,
    };
  }

  return {
    id: String(id),
    name,
    type: "END",
    outputType: typeof value.outputType === "string" ? value.outputType : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
  };
};

const buildLevels = (nodes: ExportNode[], connections: ExportWorkflow["connections"]) => {
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

  const levels = new Map<string, number>();
  const queue: string[] = [];
  const startIds = nodes.filter((n) => n.type === "START").map((n) => n.id);
  const roots =
    startIds.length > 0
      ? startIds
      : nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id);

  roots.forEach((id) => {
    levels.set(id, 0);
    queue.push(id);
  });

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const currentLevel = levels.get(current) ?? 0;
    const nexts = outgoing.get(current) ?? [];

    nexts.forEach((next) => {
      const nextLevel = currentLevel + 1;
      const existing = levels.get(next);
      if (existing === undefined || nextLevel > existing) {
        levels.set(next, nextLevel);
      }
      if (!queue.includes(next)) queue.push(next);
    });
  }

  let fallback = Array.from(levels.values()).reduce((m, v) => Math.max(m, v), 0) + 1;
  nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, fallback);
      fallback += 1;
    }
  });

  return levels;
};

export const parseWorkflowImportJson = (rawJson: string): ParseWorkflowImportResult => {
  let data: unknown;
  try {
    data = JSON.parse(rawJson.replace(/^\uFEFF/, ""));
  } catch {
    return { ok: false, error: "JSON invalido." };
  }

  if (!isRecord(data)) {
    return { ok: false, error: "El archivo debe ser un objeto JSON." };
  }

  const id = data.id;
  const name = data.name;
  const rawNodes = data.nodes;
  const rawConnections = data.connections;

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

  const nodes: ExportNode[] = [];
  for (const rawNode of rawNodes) {
    const node = toNode(rawNode);
    if (!node) {
      return { ok: false, error: "Nodo invalido en el JSON." };
    }
    nodes.push(node);
  }

  const connections: ExportWorkflow["connections"] = [];
  let invalidConnectionCount = 0;

  for (const rawConnection of rawConnections) {
    if (!isRecord(rawConnection)) {
      invalidConnectionCount += 1;
      continue;
    }
    const from = rawConnection.fromNodeId;
    const to = rawConnection.toNodeId;
    const condition = rawConnection.condition;

    if (
      (typeof from !== "string" && typeof from !== "number") ||
      (typeof to !== "string" && typeof to !== "number")
    ) {
      invalidConnectionCount += 1;
      continue;
    }

    connections.push({
      fromNodeId: String(from),
      toNodeId: String(to),
      condition: typeof condition === "boolean" ? condition : true,
    });
  }

  if (connections.length === 0 && rawConnections.length > 0) {
    return {
      ok: false,
      error:
        "Conexiones invalidas. Cada conexion debe incluir fromNodeId y toNodeId (mismo formato que POST).",
    };
  }

  const warning =
    invalidConnectionCount > 0
      ? `Se omitieron ${invalidConnectionCount} conexiones invalidas durante la importacion.`
      : undefined;

  return {
    ok: true,
    workflow: {
      id: String(id),
      name,
      nodes,
      connections,
    },
    warning,
  };
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
      const nodes = groups.get(level) ?? [];
      nodes.forEach((node, index) => {
        positions.set(node.id, {
          x: 120 + level * 300,
          y: 120 + index * 160,
        });
      });
    });

  const canvasNodes: WorkflowNodeData[] = workflow.nodes.map((node, index) => {
    const position = positions.get(node.id) ?? {
      x: 120 + index * 220,
      y: 140,
    };

    if (node.type === "HTTP") {
      return {
        id: node.id,
        title: node.name,
        type: "HTTP_REQUEST",
        x: position.x,
        y: position.y,
        config: {
          method: node.method,
          url: node.url,
          timeoutMs:
            typeof node.timeout === "number" ? String(node.timeout) : undefined,
          retries:
            typeof node.attempts === "number" ? String(node.attempts) : undefined,
          errorPolicy: node.politica === "CONTINUE" ? "CONTINUE" : "STOP",
        },
      };
    }

    if (node.type === "COMMAND") {
      return {
        id: node.id,
        title: node.name,
        type: "COMMAND",
        x: position.x,
        y: position.y,
        config: { command: node.command },
      };
    }

    if (node.type === "CONDITIONAL") {
      return {
        id: node.id,
        title: node.name,
        type: "CONDITIONAL",
        x: position.x,
        y: position.y,
        config: { sourceNodeId: node.target },
      };
    }

    if (node.type === "END") {
      return {
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
      };
    }

    return {
      id: node.id,
      title: node.name,
      type: "START",
      x: position.x,
      y: position.y,
    };
  });

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
