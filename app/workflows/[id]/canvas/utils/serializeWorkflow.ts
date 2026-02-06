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
  condition?: boolean;
};

export type ExportWorkflow = {
  id: string;
  name: string;
  nodes: ExportNode[];
  connections: ExportConnection[];
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

export const serializeWorkflowExport = (
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNodeData[],
  connections: Connection[],
): ExportWorkflow => {
  const exportNodes: ExportNode[] = nodes.map((node) => {
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
            : undefined,
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
  const backendNodes = nodes.map((node) => {
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
