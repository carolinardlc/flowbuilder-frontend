// This file contains pure helpers for workflow serialization, defaults, and validation.
// It mirrors the reference behavior while staying independent from UI and storage layers.

import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  ValidationReport,
  ValidationIssue,
  NodeType,
  NodeConfig,
} from "./types";

// Export a workflow to a stable, human-readable JSON string.
export function exportWorkflowToJSON(workflow: Workflow): string {
  return JSON.stringify(workflow, null, 2);
}

// Import a workflow from JSON, validating required fields and normalizing metadata.
// The returned workflow gets a new ID and fresh timestamps to avoid collisions.
export function importWorkflowFromJSON(
  jsonString: string
): { success: boolean; workflow?: Workflow; error?: string } {
  try {
    const parsed = JSON.parse(jsonString) as Partial<Workflow>;

    // Ensure the minimum contract is present before accepting the payload.
    if (!parsed.name || !parsed.nodes || !parsed.edges) {
      return {
        success: false,
        error:
          "Invalid JSON: missing required fields (name, nodes, edges).",
      };
    }

    const now = new Date().toISOString();

    const imported: Workflow = {
      id: generateId(),
      name: parsed.name,
      description: parsed.description ?? "",
      nodes: parsed.nodes as WorkflowNode[],
      edges: parsed.edges as WorkflowEdge[],
      createdAt: now,
      updatedAt: now,
    };

    return { success: true, workflow: imported };
  } catch (_error) {
    return {
      success: false,
      error: "Invalid JSON: malformed payload.",
    };
  }
}

// Generate a reasonably unique identifier for nodes, edges, and workflows.
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Provide a sane default config per node type to keep the editor predictable.
export function createDefaultNodeConfig(type: NodeType): NodeConfig {
  switch (type) {
    case "HTTP_REQUEST":
      return {
        errorPolicy: "STOP_ON_FAIL",
        method: "GET",
        url: "",
        headers: {},
        queryParams: {},
        body: "",
        bodyType: "json",
        timeout: 30,
        retries: 0,
        responseMapping: {},
      };
    case "COMMAND":
      return {
        errorPolicy: "STOP_ON_FAIL",
        command: "",
        arguments: [],
        envVars: {},
        workingDirectory: "",
        timeout: 60,
        captureOutput: true,
        outputMapping: {},
      };
    case "CONDITIONAL":
      return {
        errorPolicy: "STOP_ON_FAIL",
        leftOperand: "",
        operator: "equals",
        rightOperand: "",
      };
    default:
      return { errorPolicy: "STOP_ON_FAIL" };
  }
}

// Validate a workflow using the same rule set as the reference implementation.
export function validateWorkflow(workflow: Workflow): ValidationReport {
  const issues: ValidationIssue[] = [];

  // Rule: Exactly one START node must exist.
  const startNodes = workflow.nodes.filter((node) => node.type === "START");
  if (startNodes.length === 0) {
    issues.push({
      severity: "error",
      message: "Workflow must have exactly one START node.",
      action: "none",
    });
  } else if (startNodes.length > 1) {
    startNodes.slice(1).forEach((node) => {
      issues.push({
        severity: "error",
        nodeId: node.id,
        message: "Only one START node is allowed in the workflow.",
        action: "focus",
      });
    });
  }

  // Rule: Workflow must be acyclic.
  if (detectCycle(workflow.nodes, workflow.edges)) {
    issues.push({
      severity: "error",
      message: "Workflow contains cycles. Workflows must be acyclic.",
      action: "none",
    });
  }

  // Rule: All nodes must be reachable from the START node.
  if (startNodes.length === 1) {
    const reachable = getReachableNodes(startNodes[0].id, workflow.edges);
    const unreachable = workflow.nodes.filter(
      (node) => node.type !== "START" && !reachable.has(node.id)
    );
    unreachable.forEach((node) => {
      issues.push({
        severity: "warning",
        nodeId: node.id,
        message: `Node "${node.data.label}" is not reachable from START.`,
        action: "focus",
      });
    });
  }

  // Rule: Node configuration must be complete for each node type.
  workflow.nodes.forEach((node) => {
    issues.push(...validateNodeConfiguration(node));
  });

  // Rule: Structural constraints per node type (e.g., conditional edges).
  workflow.nodes.forEach((node) => {
    issues.push(...validateNodeStructure(node, workflow.edges));
  });

  return {
    isValid: issues.filter((issue) => issue.severity === "error").length === 0,
    issues,
  };
}

// Detect cycles using a DFS over the adjacency list.
function detectCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  const visited = new Set<string>();
  const stack = new Set<string>();

  nodes.forEach((node) => adjacency.set(node.id, []));
  edges.forEach((edge) => {
    const neighbors = adjacency.get(edge.source) ?? [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  });

  const dfs = (nodeId: string): boolean => {
    visited.add(nodeId);
    stack.add(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (stack.has(neighbor)) {
        return true;
      }
    }

    stack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) {
      return true;
    }
  }

  return false;
}

// Compute the set of nodes reachable from a given start node.
function getReachableNodes(
  startId: string,
  edges: WorkflowEdge[]
): Set<string> {
  const reachable = new Set<string>();
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    edges.forEach((edge) => {
      if (edge.source === current && !reachable.has(edge.target)) {
        reachable.add(edge.target);
        queue.push(edge.target);
      }
    });
  }

  return reachable;
}

// Validate that a node has the minimum required configuration.
function validateNodeConfiguration(node: WorkflowNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (node.type === "START") {
    return issues;
  }

  if (!node.data.isConfigured) {
    issues.push({
      severity: "error",
      nodeId: node.id,
      message: `Node "${node.data.label}" requires configuration.`,
      action: "focus",
    });
    return issues;
  }

  const config = node.data.config as Record<string, unknown>;

  if (node.type === "HTTP_REQUEST") {
    if (!config.url) {
      issues.push({
        severity: "error",
        nodeId: node.id,
        message: `HTTP Request node "${node.data.label}" requires a URL.`,
        action: "focus",
      });
    }
  }

  if (node.type === "COMMAND") {
    if (!config.command) {
      issues.push({
        severity: "error",
        nodeId: node.id,
        message: `Command node "${node.data.label}" requires a command.`,
        action: "focus",
      });
    }
  }

  if (node.type === "CONDITIONAL") {
    if (!config.leftOperand || !config.operator || !config.rightOperand) {
      issues.push({
        severity: "error",
        nodeId: node.id,
        message: `Conditional node "${node.data.label}" requires a full condition.`,
        action: "focus",
      });
    }
  }

  return issues;
}

// Validate structural rules per node type (e.g., conditional outputs).
function validateNodeStructure(
  node: WorkflowNode,
  edges: WorkflowEdge[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const outgoing = edges.filter((edge) => edge.source === node.id);

  if (node.type === "CONDITIONAL") {
    if (outgoing.length === 0) {
      issues.push({
        severity: "warning",
        nodeId: node.id,
        message: `Conditional node "${node.data.label}" should have 2 outputs (TRUE/FALSE).`,
        action: "focus",
      });
    } else if (outgoing.length === 1) {
      issues.push({
        severity: "warning",
        nodeId: node.id,
        message: `Conditional node "${node.data.label}" should have 2 outputs, but only has 1.`,
        action: "focus",
      });
    } else if (outgoing.length > 2) {
      issues.push({
        severity: "error",
        nodeId: node.id,
        message: `Conditional node "${node.data.label}" can only have 2 outputs (TRUE/FALSE).`,
        action: "focus",
      });
    }
  }

  return issues;
}
