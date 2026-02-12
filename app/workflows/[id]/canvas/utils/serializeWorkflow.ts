import type { Connection, WorkflowNodeData, WorkflowNodeType } from "../types";

export type BackendNode = {
  id: string;
  name: string;
  type: "START" | "COMMAND" | "HTTP" | "CONDITIONAL" | "END";
  commandType?: string;
  value?: string;
  inputKey?: string;
};

export type BackendConnection = {
  fromNodeId: string;
  toNodeId: string;
  condition: boolean;
};

export type BackendWorkflow = {
  id: string;
  name: string;
  nodes: BackendNode[];
  connections: BackendConnection[];
};

export type ExportHttpNode = {
  id: string;
  name: string;
  type: "HTTP";
  url: string;
  method: "GET" | "POST";
  politica?: "STOP" | "CONTINUE";
  timeout?: number;
  attempts?: number;
};

export type ExportCommandNode = {
  id: string;
  name: string;
  type: "COMMAND";
  command: string;
  args?: string;
  input?: string;
  output?: string;
};

export type ExportConditionalNode = {
  id: string;
  name: string;
  type: "CONDITIONAL";
  target?: string;
};

export type ExportStartNode = {
  id: string;
  name: string;
  type: "START";
};

export type ExportEndNode = {
  id: string;
  name: string;
  type: "END";
  outputType?: string;
  message?: string;
};

export type ExportNode =
  | ExportStartNode
  | ExportEndNode
  | ExportHttpNode
  | ExportConditionalNode
  | ExportCommandNode;

export type ExportConnection = {
  fromNodeId: string;
  toNodeId: string;
  condition: boolean;
};

export type ExportWorkflow = {
  id: string;
  name: string;
  nodes: ExportNode[];
  connections: ExportConnection[];
};

export type CanvasSnapshot = {
  nodes: WorkflowNodeData[];
  connections: Connection[];
};

const mapNodeType = (type: WorkflowNodeType): BackendNode["type"] => {
  if (type === "COMMAND") return "COMMAND";
  if (type === "HTTP_REQUEST") return "HTTP";
  if (type === "START") return "START";
  if (type === "CONDITIONAL") return "CONDITIONAL";
  return "END";
};

const resolveCondition = (
  connection: Connection,
  fromNode?: WorkflowNodeData,
) => {
  if (fromNode?.type !== "CONDITIONAL") return true;
  const offset = connection.fromOffsetY ?? 40;
  return offset <= 40;
};

const orderNodesByConnections = (
  nodes: WorkflowNodeData[],
  connections: Connection[],
): WorkflowNodeData[] => {
  const startNode = nodes.find((n) => n.type === "START");
  if (!startNode) return nodes;

  const outgoing = new Map<string, string[]>();
  connections.forEach((c) => {
    const list = outgoing.get(c.from) ?? [];
    list.push(c.to);
    outgoing.set(c.from, list);
  });

  const visited = new Set<string>();
  const orderedIds: string[] = [];
  const stack: string[] = [startNode.id];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    orderedIds.push(currentId);

    const nextIds = outgoing.get(currentId) ?? [];
    for (let i = nextIds.length - 1; i >= 0; i -= 1) {
      const nextId = nextIds[i];
      if (!visited.has(nextId)) stack.push(nextId);
    }
  }

  const orderedNodes = orderedIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n);

  const remaining = nodes.filter((n) => !visited.has(n.id));
  return [...orderedNodes, ...remaining];
};

export const serializeWorkflowExport = (
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNodeData[],
  connections: Connection[],
): ExportWorkflow => {
  const orderedNodes = orderNodesByConnections(nodes, connections);
  const exportNodes: ExportNode[] = orderedNodes.map((node) => {
    if (node.type === "HTTP_REQUEST") {
      const url = node.config?.url ?? "";
      const method = node.config?.method ?? "GET";
      const politica =
        node.config?.errorPolicy === "CONTINUE" ? "CONTINUE" : "STOP";
      const timeout = Number(node.config?.timeoutMs ?? "");
      const attempts = Number(node.config?.retries ?? "");

      return {
        id: node.id,
        name: node.title,
        type: "HTTP",
        url,
        method,
        ...(method === "GET"
          ? {
              politica,
              timeout: Number.isFinite(timeout) ? timeout : undefined,
              attempts: Number.isFinite(attempts) ? attempts : undefined,
            }
          : {}),
      };
    }

    if (node.type === "COMMAND") {
      return {
        id: node.id,
        name: node.title,
        type: "COMMAND",
        command: node.config?.command ?? "",
        args: node.config?.args ?? "",
        input: node.config?.input ?? "",
        output: node.config?.output ?? "",
      };
    }

    if (node.type === "CONDITIONAL") {
      return {
        id: node.id,
        name: node.title,
        type: "CONDITIONAL",
        target: node.config?.sourceNodeId || undefined,
      };
    }

    if (node.type === "END") {
      return {
        id: node.id,
        name: node.title,
        type: "END",
        outputType: node.config?.outputType,
        message: node.config?.message,
      };
    }

    return {
      id: node.id,
      name: node.title,
      type: "START",
    };
  });

  const exportConnections: ExportConnection[] = connections.map(
    (connection) => {
      const fromNode = nodes.find((node) => node.id === connection.from);
      return {
        fromNodeId: connection.from,
        toNodeId: connection.to,
        condition:
          fromNode?.type === "CONDITIONAL"
            ? resolveCondition(connection, fromNode)
            : true,
      };
    },
  );

  return {
    id: workflowId,
    name: workflowName,
    nodes: exportNodes,
    connections: exportConnections,
  };
};

export const serializeWorkflow = (
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNodeData[],
  connections: Connection[],
): BackendWorkflow => {
  const orderedNodes = orderNodesByConnections(nodes, connections);
  const backendNodes = orderedNodes.map((node) => {
    const base: BackendNode = {
      id: node.id,
      name: node.title,
      type: mapNodeType(node.type),
    };

    if (node.type === "COMMAND") {
      return {
        ...base,
        commandType: node.config?.command,
        value: node.config?.args,
        inputKey: node.config?.output,
      };
    }

    if (node.type === "HTTP_REQUEST") {
      return {
        ...base,
        inputKey: node.config?.url,
      };
    }

    return base;
  });

  const backendConnections = connections.map((connection) => {
    const fromNode = nodes.find((node) => node.id === connection.from);
    return {
      fromNodeId: connection.from,
      toNodeId: connection.to,
      condition: resolveCondition(connection, fromNode),
    };
  });

  return {
    id: workflowId,
    name: workflowName,
    nodes: backendNodes,
    connections: backendConnections,
  };
};

const mapExportTypeToCanvasType = (type: ExportNode["type"]): WorkflowNodeType => {
  if (type === "HTTP") return "HTTP_REQUEST";
  return type;
};

const buildNodeConfigFromExport = (node: ExportNode): WorkflowNodeData["config"] => {
  if (node.type === "HTTP") {
    return {
      method: node.method,
      url: node.url,
      timeoutMs:
        typeof node.timeout === "number" && Number.isFinite(node.timeout)
          ? String(node.timeout)
          : "",
      retries:
        typeof node.attempts === "number" && Number.isFinite(node.attempts)
          ? String(node.attempts)
          : "",
      errorPolicy: node.politica === "CONTINUE" ? "CONTINUE" : "STOP",
    };
  }

  if (node.type === "COMMAND") {
    return {
      command: node.command,
      args: node.args ?? "",
      input: node.input ?? "",
      output: node.output ?? "",
    };
  }

  if (node.type === "CONDITIONAL") {
    return {
      sourceNodeId: node.target ?? "",
    };
  }

  if (node.type === "END") {
    return {
      outputType:
        node.outputType === "error" || node.outputType === "notification"
          ? node.outputType
          : "success",
      message: node.message ?? "",
    };
  }

  return {};
};

export const deserializeWorkflowImport = (
  payload: ExportWorkflow,
): CanvasSnapshot => {
  const baseX = 120;
  const baseY = 120;
  const colGap = 260;
  const rowGap = 150;
  const maxCols = 4;

  const nodes: WorkflowNodeData[] = payload.nodes.map((node, index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);

    return {
      id: node.id,
      title: node.name,
      type: mapExportTypeToCanvasType(node.type),
      x: baseX + col * colGap,
      y: baseY + row * rowGap,
      config: buildNodeConfigFromExport(node),
    };
  });

  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const connections: Connection[] = payload.connections.map((connection, index) => {
    const fromNode = nodesById.get(connection.fromNodeId);
    const fromOffsetY =
      fromNode?.type === "CONDITIONAL"
        ? connection.condition
          ? 24
          : 56
        : 40;

    return {
      id: `c-${index + 1}`,
      from: connection.fromNodeId,
      to: connection.toNodeId,
      fromOffsetY,
    };
  });

  return { nodes, connections };
};
