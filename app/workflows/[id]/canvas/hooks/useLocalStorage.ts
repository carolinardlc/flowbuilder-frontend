/**
 * Hook personalizado para manejar persistencia en localStorage
 */

import { useEffect, useRef, useState } from "react";
import type { WorkflowNodeData, Connection } from "../types";
import { STORAGE_KEYS } from "../constants/storage";
import {
  loadWorkflowCanvasSnapshot,
  saveWorkflowCanvasSnapshot,
} from "../../../../services/workflowCanvasStorage";
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
  const hasSkippedInitialSave = useRef(false);

  useEffect(() => {
    if (!storageKey) return;
    hasSkippedInitialSave.current = false;

    try {
      const snapshot = loadWorkflowCanvasSnapshot(workflowId);
      if (!snapshot) return;

      onNodesLoaded(snapshot.nodes);
      onConnectionsLoaded(snapshot.connections);

      const maxNum =
        snapshot.nodes
          .map((node) => Number(String(node.id).replace("node-", "")))
          .filter((value) => Number.isFinite(value))
          .reduce((max, value) => Math.max(max, value), 0) || 0;

      onNodeIdCounterUpdate(maxNum + 1);
      onSetNextNodeId(maxNum + 1);
    } catch (error) {
      console.error("Error loading canvas from localStorage:", error);
    } finally {
      setIsHydrated(true);
    }
  }, [
    storageKey,
    workflowId,
    onNodesLoaded,
    onConnectionsLoaded,
    onNodeIdCounterUpdate,
    onSetNextNodeId,
  ]);

  useEffect(() => {
    if (!storageKey) return;
    if (!isHydrated) return;
    if (!hasSkippedInitialSave.current) {
      hasSkippedInitialSave.current = true;
      return;
    }

    try {
      const payload = { nodes, connections };
      saveWorkflowCanvasSnapshot(workflowId, payload);
      void syncWorkflowCanvasSnapshot(workflowId, payload);
    } catch (error) {
      console.error("Error saving canvas to localStorage:", error);
    }
  }, [storageKey, nodes, connections, isHydrated, workflowId]);
}
