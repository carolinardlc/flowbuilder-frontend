import type { BackendWorkflowPayload, Workflow } from "./types";
import {
  getSafeConnections,
  mapNodeTypeToBackend,
  orderNodesByConnections,
  resolveConnectionCondition,
} from "./helpers";

// Serializador puro para payload de backend.
export function toBackendWorkflow(workflow: Workflow): BackendWorkflowPayload {
  const orderedNodes = orderNodesByConnections(
    workflow.nodes,
    workflow.connections,
  );
  const safeConnections = getSafeConnections(workflow.nodes, workflow.connections);

  const nodes = orderedNodes.map((node) => {
    const baseNode = {
      id: node.id,
      name: node.title,
      type: mapNodeTypeToBackend(node.type),
    } as const;

    if (node.type === "COMMAND") {
      return {
        ...baseNode,
        commandType: node.config?.command,
        value: node.config?.args,
        inputKey: node.config?.output,
      };
    }

    if (node.type === "HTTP_REQUEST") {
      return {
        ...baseNode,
        inputKey: node.config?.url,
      };
    }

    return baseNode;
  });

  const connections = safeConnections.map((connection) => {
    const fromNode = workflow.nodes.find((node) => node.id === connection.from);
    return {
      fromNodeId: connection.from,
      toNodeId: connection.to,
      condition: resolveConnectionCondition(connection, fromNode),
    };
  });

  return {
    id: workflow.id,
    name: workflow.name,
    nodes,
    connections,
  };
}
