// This file defines the data contract for the ReactFlow-based workflow canvas.
// It mirrors the reference JSON shape, but stays UI-agnostic and style-agnostic.

// Node kinds supported by the workflow builder.
export type NodeType = "START" | "HTTP_REQUEST" | "COMMAND" | "CONDITIONAL";

// Error handling policy for a node execution.
export type ErrorPolicy = "STOP_ON_FAIL" | "CONTINUE_ON_FAIL";

// HTTP methods allowed in HTTP request nodes.
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

// Operators supported by conditional nodes.
export type ConditionalOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "contains"
  | "notContains";

// Base configuration shared by all node types.
export interface BaseNodeConfig {
  errorPolicy: ErrorPolicy;
}

// Configuration for HTTP request nodes.
export interface HttpRequestConfig extends BaseNodeConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  bodyType: "text" | "json";
  timeout: number;
  retries: number;
  responseMapping: Record<string, string>;
}

// Configuration for command execution nodes.
export interface CommandConfig extends BaseNodeConfig {
  command: string;
  arguments: string[];
  envVars?: Record<string, string>;
  workingDirectory?: string;
  timeout: number;
  captureOutput: boolean;
  outputMapping: Record<string, string>;
}

// Configuration for conditional nodes.
export interface ConditionalConfig extends BaseNodeConfig {
  leftOperand: string;
  operator: ConditionalOperator;
  rightOperand: string;
}

// Union of all supported configuration payloads.
export type NodeConfig =
  | HttpRequestConfig
  | CommandConfig
  | ConditionalConfig
  | BaseNodeConfig;

// Workflow node definition used for persistence and validation.
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: NodeConfig;
    isConfigured: boolean;
  };
}

// Workflow edge definition used for persistence and validation.
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string; // Used for conditional TRUE/FALSE edges.
  type?: "default" | "conditional";
}

// Workflow entity stored in local persistence and exported/imported as JSON.
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

// Validation severity levels.
export type ValidationSeverity = "error" | "warning" | "info";

// Validation issue emitted by the validator.
export interface ValidationIssue {
  severity: ValidationSeverity;
  nodeId?: string;
  message: string;
  action?: "focus" | "none";
}

// Validation report returned by the validator.
export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
}

// Catalog item used by the node palette UI.
export interface NodeCatalogItem {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  disabled?: boolean;
  category: string;
}
