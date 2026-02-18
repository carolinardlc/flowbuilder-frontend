import type { BackendWorkflowPayload, Workflow } from "./types";
import {
  getSafeConnections,
  mapNodeTypeToBackend,
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

const HTTP_INDEX_URLS: Record<string, string> = {
  "The Legend of Zelda: Breath of the Wild":
    "https://jsonplaceholder.typicode.com/posts/1",
  "Elden Ring": "https://jsonplaceholder.typicode.com/users/1",
  "Hollow Knight": "https://jsonplaceholder.typicode.com/todos/1",
  "Street Fighter 6": "https://jsonplaceholder.typicode.com/comments/1",
  "Final Fantasy VII Rebirth": "https://jsonplaceholder.typicode.com/albums/1",
};

const resolveHttpUrlFromIndex = (indexValue?: string) => {
  if (!indexValue) return "";

  if (indexValue in HTTP_INDEX_URLS) {
    return HTTP_INDEX_URLS[indexValue] ?? "";
  }

  const legacyMap: Record<number, string> = {
    1: "The Legend of Zelda: Breath of the Wild",
    2: "Elden Ring",
    3: "Hollow Knight",
    4: "Street Fighter 6",
    5: "Final Fantasy VII Rebirth",
  };

  const n = Number(indexValue);
  if (!Number.isFinite(n)) return "";
  const key = legacyMap[n];
  return key ? (HTTP_INDEX_URLS[key] ?? "") : "";
};

const resolveHttpIndexNumber = (indexValue?: string) => {
  if (!indexValue) return undefined;

  if (indexValue in GAME_TO_INDEX) {
    return GAME_TO_INDEX[indexValue];
  }

  const n = Number(indexValue);
  if (!Number.isFinite(n)) return undefined;
  if (n < 1 || n > 5) return undefined;
  return n;
};

// Serializador puro para payload de backend.
export function toBackendWorkflow(workflow: Workflow): BackendWorkflowPayload {
  const orderedNodes = orderNodesByConnections(
    workflow.nodes,
    workflow.connections,
  );
  const safeConnections = getSafeConnections(
    workflow.nodes,
    workflow.connections,
  );

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
      const inputKey =
        node.config?.url || resolveHttpUrlFromIndex(node.config?.index);
      const index = resolveHttpIndexNumber(node.config?.index);
      return {
        ...baseNode,
        inputKey,
        index,
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
