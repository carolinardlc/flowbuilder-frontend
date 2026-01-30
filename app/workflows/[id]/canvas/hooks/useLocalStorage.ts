/**
 * Hook personalizado para manejar persistencia en localStorage
 */

import { useEffect } from "react";
import type { WorkflowNodeData, Connection } from "../types";
import { STORAGE_KEYS } from "../constants/storage";

interface UseLocalStorageProps {
  workflowId: string;
  nodes: WorkflowNodeData[];
  connections: Connection[];
  onNodesLoaded: (nodes: WorkflowNodeData[]) => void;
  onConnectionsLoaded: (connections: Connection[]) => void;
  onNodeIdCounterUpdate: (counter: number) => void;
  onSetNextNodeId: (id: number) => void;
}

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

      const loadedNodes = parsed.nodes ?? [];
      const loadedConnections = parsed.connections ?? [];

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

    try {
      localStorage.setItem(storageKey, JSON.stringify({ nodes, connections }));
    } catch (err) {
      console.error("Error saving canvas to localStorage:", err);
    }
  }, [storageKey, nodes, connections]);
}
