import type { ExportWorkflowJson, Workflow } from "./types";
import {
  getSafeConnections,
  orderNodesByConnections,
  resolveConnectionCondition,
} from "./helpers";

// Serializador puro para exportación JSON.
export function toExportWorkflow(workflow: Workflow): ExportWorkflowJson {
  const orderedNodes = orderNodesByConnections(
    workflow.nodes,
    workflow.connections,
  );
  const safeConnections = getSafeConnections(workflow.nodes, workflow.connections);

  const nodes = orderedNodes.map((node) => {
    if (node.type === "HTTP_REQUEST") {
      const method = node.config?.method ?? "GET";
      const timeout = Number(node.config?.timeoutMs ?? "");
      const attempts = Number(node.config?.retries ?? "");

      return {
        id: node.id,
        name: node.title,
        type: "HTTP" as const,
        url: node.config?.url ?? "",
        method,
        ...(method === "GET"
          ? {
              politica: (
                node.config?.errorPolicy === "CONTINUE" ? "CONTINUE" : "STOP"
              ) as "STOP" | "CONTINUE",
              timeout: Number.isFinite(timeout) ? timeout : undefined,
              attempts: Number.isFinite(attempts) ? attempts : undefined,
            }
          : {}),
      };
    }

    if (node.type === "COMMAND") {
      return {
        id: node.id,
        name: node.title,
        type: "COMMAND" as const,
        command: node.config?.command ?? "",
      };
    }

    if (node.type === "CONDITIONAL") {
      return {
        id: node.id,
        name: node.title,
        type: "CONDITIONAL" as const,
        target: node.config?.sourceNodeId || undefined,
      };
    }

    if (node.type === "END") {
      return {
        id: node.id,
        name: node.title,
        type: "END" as const,
        outputType: node.config?.outputType,
        message: node.config?.message,
      };
    }

    return {
      id: node.id,
      name: node.title,
      type: "START" as const,
    };
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
