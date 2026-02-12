/**
 * Hook personalizado para manejar persistencia en localStorage
 */

import { useEffect, useState } from "react";
import type { WorkflowNodeData, Connection } from "../types";
import { STORAGE_KEYS } from "../constants/storage";
import {
  deserializeWorkflowImport,
  serializeWorkflowExport,
  type ExportWorkflow,
} from "../utils/serializeWorkflow";

const BACKEND_BASE_URL = "http://192.168.5.2:8080";

interface UseLocalStorageProps {
  workflowId: string;
  workflowName: string;
  nodes: WorkflowNodeData[];
  connections: Connection[];
  onNodesLoaded: (nodes: WorkflowNodeData[]) => void;
  onConnectionsLoaded: (connections: Connection[]) => void;
  onSetNextNodeId: (id: number) => void;
}

export function useLocalStorage({
  workflowId,
  workflowName,
  nodes,
  connections,
  onNodesLoaded,
  onConnectionsLoaded,
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

      const parsed = JSON.parse(raw) as ExportWorkflow;
      const canvasSnapshot = deserializeWorkflowImport(parsed);
      const loadedNodes = canvasSnapshot.nodes;
      const loadedConnections = canvasSnapshot.connections;

      onNodesLoaded(loadedNodes);
      onConnectionsLoaded(loadedConnections);

      // Recalcular contador para no repetir ids
      const maxNum =
        loadedNodes
          .map((n) => Number(String(n.id).replace("node-", "")))
          .filter((x) => Number.isFinite(x))
          .reduce((a, b) => Math.max(a, b), 0) || 0;

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
    onSetNextNodeId,
  ]);

  // Guardar datos en localStorage
  useEffect(() => {
    if (!storageKey) return;
    if (!isHydrated) return;

    try {
      const payload = serializeWorkflowExport(
        workflowId,
        workflowName,
        nodes,
        connections,
      );
      localStorage.setItem(storageKey, JSON.stringify(payload));

      const url = `${BACKEND_BASE_URL}/api/workflows/${workflowId}/canvas`;

      void fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Error saving canvas to localStorage:", err);
    }
  }, [storageKey, nodes, connections, isHydrated, workflowId, workflowName]);
}
