/**
 * Hook personalizado para manejar el estado principal del Canvas y su Historial
 */

import { useState, useCallback, useEffect } from "react";
import type {
  WorkflowNodeData,
  Connection,
  DragState,
  NodeConfig,
} from "../types";
import { DEFAULT_DRAG_STATE } from "../constants/storage";

interface CanvasSnapshot {
  nodes: WorkflowNodeData[];
  connections: Connection[];
}

const duplicateNode = (node: WorkflowNodeData, newNodeId: string): WorkflowNodeData => ({
  ...node,
  id: newNodeId,
  title: `${node.title} (copia)`,
  x: node.x + 50,
  y: node.y + 50,
});

const isFormElementTarget = (target: EventTarget | null): boolean => {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
};

function useCanvasHistory() {
  const [past, setPast] = useState<CanvasSnapshot[]>([]);
  const [future, setFuture] = useState<CanvasSnapshot[]>([]);

  const takeSnapshot = useCallback((snapshot: CanvasSnapshot) => {
    setPast((prev) => [...prev, snapshot]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previousSnapshot = past[past.length - 1];
    setPast((prev) => prev.slice(0, prev.length - 1));
    return previousSnapshot;
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const nextSnapshot = future[0];
    setFuture((prev) => prev.slice(1));
    return nextSnapshot;
  }, [future]);

  const pushFuture = useCallback((snapshot: CanvasSnapshot) => {
    setFuture((prev) => [snapshot, ...prev]);
  }, []);

  const pushPast = useCallback((snapshot: CanvasSnapshot) => {
    setPast((prev) => [...prev, snapshot]);
  }, []);

  return {
    past,
    future,
    takeSnapshot,
    undo,
    redo,
    pushFuture,
    pushPast,
  };
}

function useUndoRedoHotkeys({
  onUndo,
  onRedo,
}: {
  onUndo: () => void;
  onRedo: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFormElementTarget(e.target)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);
}

export function useCanvasState() {
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [dragState, setDragState] = useState<DragState>(DEFAULT_DRAG_STATE);

  const {
    past,
    future,
    takeSnapshot,
    undo: consumeUndo,
    redo: consumeRedo,
    pushFuture,
    pushPast,
  } = useCanvasHistory();

  const getCurrentSnapshot = useCallback(
    (): CanvasSnapshot => ({ nodes, connections }),
    [nodes, connections],
  );

  const takeCurrentSnapshot = useCallback(() => {
    takeSnapshot(getCurrentSnapshot());
  }, [getCurrentSnapshot, takeSnapshot]);

  const undo = useCallback(() => {
    const previousSnapshot = consumeUndo();
    if (!previousSnapshot) return;

    pushFuture(getCurrentSnapshot());
    setNodes(previousSnapshot.nodes);
    setConnections(previousSnapshot.connections);
    setSelectedNodeId(null);
  }, [consumeUndo, getCurrentSnapshot, pushFuture]);

  const redo = useCallback(() => {
    const nextSnapshot = consumeRedo();
    if (!nextSnapshot) return;

    pushPast(getCurrentSnapshot());
    setNodes(nextSnapshot.nodes);
    setConnections(nextSnapshot.connections);
    setSelectedNodeId(null);
  }, [consumeRedo, getCurrentSnapshot, pushPast]);

  useUndoRedoHotkeys({ onUndo: undo, onRedo: redo });

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const handleOpenConfig = useCallback(() => {
    if (selectedNode) setIsConfigPanelOpen(true);
  }, [selectedNode]);

  const handleCloseConfig = useCallback(() => {
    setIsConfigPanelOpen(false);
  }, []);

  const handleSaveConfig = useCallback(
    (config: NodeConfig) => {
      takeCurrentSnapshot();
      setNodes((prev) =>
        prev.map((node) =>
          node.id === config.id
            ? { ...node, title: config.title, config: config.config }
            : node,
        ),
      );
      setIsConfigPanelOpen(false);
    },
    [takeCurrentSnapshot],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      takeCurrentSnapshot();
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setConnections((prev) =>
        prev.filter((c) => c.from !== nodeId && c.to !== nodeId),
      );
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [selectedNodeId, takeCurrentSnapshot],
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string, newNodeId: string) => {
      takeCurrentSnapshot();
      const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
      if (!nodeToDuplicate) return;

      setNodes((prev) => [...prev, duplicateNode(nodeToDuplicate, newNodeId)]);
      setSelectedNodeId(newNodeId);
    },
    [nodes, takeCurrentSnapshot],
  );

  return {
    nodes,
    connections,
    selectedNode,
    selectedNodeId,
    isConfigPanelOpen,
    dragState,
    setNodes,
    setConnections,
    setSelectedNodeId,
    setIsConfigPanelOpen,
    setDragState,
    handleOpenConfig,
    handleCloseConfig,
    handleSaveConfig,
    handleDeleteNode,
    handleDuplicateNode,
    takeSnapshot: takeCurrentSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
