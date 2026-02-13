import type { Connection, WorkflowNodeData } from "../../types";

export type Node = WorkflowNodeData;

export type Workflow = {
  id?: string;
  name?: string;
  nodes: Node[];
  connections: Connection[];
};

export type ValidationError = {
  code:
    | "START_MISSING"
    | "START_MULTIPLE"
    | "CYCLE_DETECTED"
    | "UNREACHABLE_NODE"
    | "NODE_CONFIG_INVALID";
  message: string;
  nodeId?: string;
};
