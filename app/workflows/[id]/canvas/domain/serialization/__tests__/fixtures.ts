import type { Connection, WorkflowNodeData } from "../../../types";
import type { Workflow } from "../types";

export const createNode = (
  overrides: Partial<WorkflowNodeData> & Pick<WorkflowNodeData, "id" | "type">,
): WorkflowNodeData => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  type: overrides.type,
  x: overrides.x ?? 0,
  y: overrides.y ?? 0,
  config: overrides.config,
});

export const createConnection = (
  from: string,
  to: string,
  overrides?: Partial<Connection>,
): Connection => ({
  id: overrides?.id ?? `${from}-${to}`,
  from,
  to,
  fromOffsetY: overrides?.fromOffsetY,
});

export const createWorkflow = (
  nodes: WorkflowNodeData[],
  connections: Connection[],
): Workflow => ({
  id: "wf-1",
  name: "Workflow de prueba",
  nodes,
  connections,
});
