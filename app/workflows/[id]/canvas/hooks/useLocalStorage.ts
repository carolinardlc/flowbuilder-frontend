/**
 * Hook personalizado para manejar persistencia en localStorage
 */

import { useEffect, useState } from "react";
import type { WorkflowNodeData, Connection } from "../types";
import { STORAGE_KEYS } from "../constants/storage";
import { syncWorkflowCanvasSnapshot } from "../services/workflowApi";

interface UseLocalStorageProps {
  workflowId: string;
  nodes: WorkflowNodeData[];
  connections: Connection[];
  onNodesLoaded: (nodes: WorkflowNodeData[]) => void;
  onConnectionsLoaded: (connections: Connection[]) => void;
  onNodeIdCounterUpdate: (counter: number) => void;
  onSetNextNodeId: (id: number) => void;
}

const isValidNode = (value: unknown): value is WorkflowNodeData => {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<WorkflowNodeData>;
  return (
    typeof node.id === "string" &&
    typeof node.title === "string" &&
    typeof node.type === "string" &&
    typeof node.x === "number" &&
    typeof node.y === "number"
  );
};

const isValidConnection = (value: unknown): value is Connection => {
  if (!value || typeof value !== "object") return false;
  const connection = value as Partial<Connection>;
  return (
    typeof connection.id === "string" &&
    typeof connection.from === "string" &&
    typeof connection.to === "string"
  );
};

export function useLocalStorage({
  workflowId,
  nodes,
  connections,
  onNodesLoaded,
  onConnectionsLoaded,
  onNodeIdCounterUpdate,
  onSetNextNodeId,
}: UseLocalStorageProps) {
  const storageKey = STORAGE_KEYS.WORKFLOW_CANVAS(workflowId);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar datos desde localStorage
  useEffect(() => {
    if (!storageKey) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        nodes?: WorkflowNodeData[];
        connections?: Connection[];
      };

      const loadedNodes = Array.isArray(parsed.nodes)
        ? parsed.nodes.filter(isValidNode)
        : [];
      const nodeIds = new Set(loadedNodes.map((node) => node.id));
      const loadedConnections = Array.isArray(parsed.connections)
        ? parsed.connections.filter(
            (connection) =>
              isValidConnection(connection) &&
              nodeIds.has(connection.from) &&
              nodeIds.has(connection.to),
          )
        : [];

      onNodesLoaded(loadedNodes);
      onConnectionsLoaded(loadedConnections);

      // Recalcular contador para no repetir ids
      const maxNum =
        loadedNodes
          .map((n) => Number(String(n.id).replace("node-", "")))
          .filter((x) => Number.isFinite(x))
          .reduce((a, b) => Math.max(a, b), 0) || 0;

      onNodeIdCounterUpdate(maxNum + 1);
      onSetNextNodeId(maxNum + 1);
    } catch (err) {
      console.error("Error loading canvas from localStorage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, [
    storageKey,
    onNodesLoaded,
    onConnectionsLoaded,
    onNodeIdCounterUpdate,
    onSetNextNodeId,
  ]);

  // Guardar datos en localStorage
  useEffect(() => {
    if (!storageKey) return;
    if (!isHydrated) return;

    try {
      const payload = { nodes, connections };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      // Refactor: la sincronización remota sale del hook y vive en services/.
      void syncWorkflowCanvasSnapshot(workflowId, payload);
    } catch (err) {
      console.error("Error saving canvas to localStorage:", err);
    }
  }, [storageKey, nodes, connections, isHydrated, workflowId]);
}
