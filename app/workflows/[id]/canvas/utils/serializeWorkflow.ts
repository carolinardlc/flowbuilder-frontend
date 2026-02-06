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

export type ExportHttpRequestNode = {
  id: string;
  name: string;
  type: "HTTP_REQUEST";
  config: {
    method: "GET" | "POST";
    url: string;
    timeoutMs?: string;
    retries?: string;
    errorPolicy?: string;
    outputMapping?: Record<string, string>;
    output?: string;
  };
};

export type ExportCommandNode = {
  id: string;
  name: string;
  type: "COMMAND";
  config: {
    command: string;
    args?: string;
    input?: string;
    output?: string;
  };
};

export type ExportConditionalNode = {
  id: string;
  name: string;
  type: "CONDITIONAL";
  config: {
    condition: string;
  };
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
  config?: {
    outputType?: string;
    message?: string;
  };
};

export type ExportNode =
  | ExportStartNode
  | ExportEndNode
  | ExportHttpRequestNode
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
      const method = node.config?.method ?? "GET";
      const url = node.config?.url ?? "";

      if (method === "POST") {
        return {
          id: node.id,
          name: node.title,
          type: "HTTP_REQUEST",
          config: {
            method,
            url,
            output: node.config?.httpOutput ?? "",
          },
        };
      }

      return {
        id: node.id,
        name: node.title,
        type: "HTTP_REQUEST",
        config: {
          method,
          url,
          timeoutMs: node.config?.timeoutMs ?? "",
          retries: node.config?.retries ?? "",
          errorPolicy: node.config?.errorPolicy ?? "STOP_ON_FAIL",
          outputMapping: node.config?.outputMapping ?? {},
        },
      };
    }

    if (node.type === "COMMAND") {
      return {
        id: node.id,
        name: node.title,
        type: "COMMAND",
        config: {
          command: node.config?.command ?? "",
          args: node.config?.args ?? "",
          input: node.config?.input ?? "",
          output: node.config?.output ?? "",
        },
      };
    }

    if (node.type === "CONDITIONAL") {
      return {
        id: node.id,
        name: node.title,
        type: "CONDITIONAL",
        config: {
          condition: node.config?.conditionExpression ?? "",
        },
      };
    }

    if (node.type === "END") {
      return {
        id: node.id,
        name: node.title,
        type: "END",
        config: {
          outputType: node.config?.outputType,
          message: node.config?.message,
        },
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
