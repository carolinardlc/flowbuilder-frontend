import type { ValidationError, Workflow } from "./types";
import { validateNodeConfig } from "./validateNodeConfig";
import { validateNoCycles } from "./validateNoCycles";
import { validateReachability } from "./validateReachability";
import { validateStartNode } from "./validateStartNode";

export function validateWorkflow(workflow: Workflow): ValidationError[] {
  const startErrors = validateStartNode(workflow.nodes);
  const cycleErrors = validateNoCycles(workflow.nodes, workflow.connections);
  const reachabilityErrors = validateReachability(
    workflow.nodes,
    workflow.connections,
  );
  const configErrors = workflow.nodes.flatMap((node) => validateNodeConfig(node));

  return [...startErrors, ...cycleErrors, ...reachabilityErrors, ...configErrors];
}
