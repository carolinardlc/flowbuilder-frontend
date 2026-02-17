import {
  toBackendWorkflow,
  toExportWorkflow,
  type BackendWorkflowPayload,
  type ExportCommandNode,
  type ExportConditionalNode,
  type ExportConnection,
  type ExportEndNode,
  type ExportHttpNode,
  type ExportNode,
  type ExportStartNode,
  type ExportWorkflowJson,
  type Workflow,
} from "../domain/serialization";
import type { Connection, WorkflowNodeData } from "../types";

// Compatibilidad temporal: mantener API previa mientras migran imports antiguos.
export type BackendNode = BackendWorkflowPayload["nodes"][number];
export type BackendConnection = BackendWorkflowPayload["connections"][number];
export type BackendWorkflow = BackendWorkflowPayload;
export type ExportWorkflow = ExportWorkflowJson;

export type {
  ExportCommandNode,
  ExportConditionalNode,
  ExportConnection,
  ExportEndNode,
  ExportHttpNode,
  ExportNode,
  ExportStartNode,
};

const toWorkflowModel = (
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNodeData[],
  connections: Connection[],
): Workflow => ({
  id: workflowId,
  name: workflowName,
  nodes,
  connections,
});

export const serializeWorkflowExport = (
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNodeData[],
  connections: Connection[],
): ExportWorkflowJson => {
  return toExportWorkflow(toWorkflowModel(workflowId, workflowName, nodes, connections));
};

export const serializeWorkflow = (
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNodeData[],
  connections: Connection[],
): BackendWorkflowPayload => {
  return toBackendWorkflow(toWorkflowModel(workflowId, workflowName, nodes, connections));
};
