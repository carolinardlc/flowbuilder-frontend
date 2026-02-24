import type { ExportWorkflowJson, Workflow } from "./types";
import {
  getSafeConnections,
  orderNodesByConnections,
  resolveConnectionCondition,
} from "./helpers";

const GAME_TO_INDEX: Record<string, number> = {
  "The Legend of Zelda: Breath of the Wild": 1,
  "Elden Ring": 2,
  "Hollow Knight": 3,
  "Street Fighter 6": 4,
  "Final Fantasy VII Rebirth": 5,
};

const resolveHttpIndexNumber = (indexValue?: string) => {
  if (!indexValue) return undefined;
  if (indexValue in GAME_TO_INDEX) return GAME_TO_INDEX[indexValue];
  const n = Number(indexValue);
  if (!Number.isFinite(n)) return undefined;
  if (n < 1 || n > 5) return undefined;
  return n;
};

const resolveHttpExportMetadata = (node: Workflow["nodes"][number]) => {
  const timeout = Number(node.config?.timeoutMs ?? "");
  const attempts = Number(node.config?.retries ?? "");

  return {
    politica: (node.config?.errorPolicy === "CONTINUE"
      ? "CONTINUE"
      : "STOP") as "STOP" | "CONTINUE",
    timeout: Number.isFinite(timeout) ? timeout : undefined,
    attempts: Number.isFinite(attempts) ? attempts : undefined,
  };
};

const toExportHttpNode = (node: Workflow["nodes"][number]) => {
  const method = node.config?.method ?? "GET";
  const index = resolveHttpIndexNumber(node.config?.index);

  return {
    id: node.id,
    name: node.title,
    type: "HTTP" as const,
    method,
    index,
    ...(method === "GET" ? resolveHttpExportMetadata(node) : {}),
  };
};

const toExportCommandNode = (node: Workflow["nodes"][number]) => ({
  id: node.id,
  name: node.title,
  type: "COMMAND" as const,
  command: node.config?.command ?? "",
});

const toExportConditionalNode = (node: Workflow["nodes"][number]) => ({
  id: node.id,
  name: node.title,
  type: "CONDITIONAL" as const,
  target: node.config?.sourceNodeId ?? "",
});

const toExportEndNode = (node: Workflow["nodes"][number]) => ({
  id: node.id,
  name: node.title,
  type: "END" as const,
  outputType: node.config?.outputType,
  message: node.config?.message,
});

const toExportStartNode = (node: Workflow["nodes"][number]) => ({
  id: node.id,
  name: node.title,
  type: "START" as const,
});

const toExportNode = (node: Workflow["nodes"][number]) => {
  if (node.type === "HTTP_REQUEST") return toExportHttpNode(node);
  if (node.type === "COMMAND") return toExportCommandNode(node);
  if (node.type === "CONDITIONAL") return toExportConditionalNode(node);
  if (node.type === "END") return toExportEndNode(node);
  return toExportStartNode(node);
};

export function toExportWorkflow(workflow: Workflow): ExportWorkflowJson {
  const orderedNodes = orderNodesByConnections(
    workflow.nodes,
    workflow.connections,
  );
  const safeConnections = getSafeConnections(workflow.nodes, workflow.connections);

  const nodes = orderedNodes.map(toExportNode);

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
