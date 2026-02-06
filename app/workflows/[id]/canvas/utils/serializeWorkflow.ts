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
