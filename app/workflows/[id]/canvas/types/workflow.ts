// types/workflow.ts
export type WorkflowNodeType = "START" | "ACTION" | "CONDITIONAL" | "END";

// config mínima Sprint 1 (puedes crecer luego)
export type ActionType = "http_request" | "command" | "webhook";

export type NodeConfig = {
  // ACTION
  actionType?: ActionType;
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  command?: string;
  args?: string;

  // END
  outputType?: "success" | "error" | "notification";
  message?: string;

  // CONDITIONAL (sprint 2)
  // condition?: { ... }
};

export type WorkflowNodeDef = {
  id: string;
  type: WorkflowNodeType;
  name: string;
  position: { x: number; y: number };
  config: NodeConfig;
};

export type WorkflowConnectionDef = {
  id: string;
  from: string;
  to: string;
  label?: "TRUE" | "FALSE";
};

export type WorkflowDefinition = {
  workflowId: string;
  nodes: WorkflowNodeDef[];
  connections: WorkflowConnectionDef[];
};
