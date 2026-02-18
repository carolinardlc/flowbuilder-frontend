import type { Connection, WorkflowNodeData } from "../../types";

// Modelo de entrada para serializadores de dominio (sin dependencias de UI).
export type Workflow = {
  id: string;
  name: string;
  nodes: WorkflowNodeData[];
  connections: Connection[];
};

export type BackendNodePayload = {
  id: string;
  name: string;
  type: "START" | "COMMAND" | "HTTP" | "CONDITIONAL" | "END";
  commandType?: string;
  value?: string;
  inputKey?: string;
};

export type BackendConnectionPayload = {
  fromNodeId: string;
  toNodeId: string;
  condition: boolean;
};

export type BackendWorkflowPayload = {
  id: string;
  name: string;
  nodes: BackendNodePayload[];
  connections: BackendConnectionPayload[];
};

export type ExportHttpNode = {
  id: string;
  name: string;
  type: "HTTP";
  method: "GET" | "POST";
  politica?: "STOP" | "CONTINUE";
  timeout?: number;
  attempts?: number;
  index?: number;
};

export type ExportCommandNode = {
  id: string;
  name: string;
  type: "COMMAND";
  command: string;
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

export type ExportWorkflowJson = {
  id: string;
  name: string;
  nodes: ExportNode[];
  connections: ExportConnection[];
};
