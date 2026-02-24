/**
 * Hook personalizado para manejar el estado principal del Canvas y su Historial
 */

import { useState, useCallback, useEffect } from 'react';
import type { WorkflowNodeData, Connection, DragState, NodeConfig } from '../types';
import { DEFAULT_DRAG_STATE } from '../constants/storage';

interface CanvasSnapshot {
  nodes: WorkflowNodeData[];
  connections: Connection[];
}

export function useCanvasState() {
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [dragState, setDragState] = useState<DragState>(DEFAULT_DRAG_STATE);

  // --- HISTORIAL DE ESTADOS (UNDO / REDO) ---
  const [past, setPast] = useState<CanvasSnapshot[]>([]);
  const [future, setFuture] = useState<CanvasSnapshot[]>([]);

  const takeSnapshot = useCallback(() => {
    setPast((prev) => [...prev, { nodes, connections }]);
    setFuture([]); // Al hacer un nuevo cambio, se borra el futuro
  }, [nodes, connections]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((prev) => [{ nodes, connections }, ...prev]);
    setPast((prev) => prev.slice(0, prev.length - 1));
    setNodes(previous.nodes);
    setConnections(previous.connections);
    setSelectedNodeId(null);
  }, [past, nodes, connections]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast((prev) => [...prev, { nodes, connections }]);
    setFuture((prev) => prev.slice(1));
    setNodes(next.nodes);
    setConnections(next.connections);
    setSelectedNodeId(null);
  }, [future, nodes, connections]);

  // Atajos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  // ------------------------------------------

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const handleOpenConfig = useCallback(() => {
    if (selectedNode) setIsConfigPanelOpen(true);
  }, [selectedNode]);

  const handleCloseConfig = useCallback(() => {
    setIsConfigPanelOpen(false);
  }, []);

  const handleSaveConfig = useCallback((config: NodeConfig) => {
    takeSnapshot();
    setNodes((prev) =>
      prev.map((node) =>
        node.id === config.id
          ? { ...node, title: config.title, config: config.config }
          : node,
      ),
    );
    setIsConfigPanelOpen(false);
  }, [takeSnapshot]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    takeSnapshot();
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) =>
      prev.filter((c) => c.from !== nodeId && c.to !== nodeId),
    );
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId, takeSnapshot]);

  const handleDuplicateNode = useCallback((nodeId: string, newNodeId: string) => {
    takeSnapshot();
    const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const duplicatedNode: WorkflowNodeData = {
      ...nodeToDuplicate,
      id: newNodeId,
      title: `${nodeToDuplicate.title} (copia)`,
      x: nodeToDuplicate.x + 50,
      y: nodeToDuplicate.y + 50,
    };

    setNodes((prev) => [...prev, duplicatedNode]);
    setSelectedNodeId(newNodeId);
  }, [nodes, takeSnapshot]);

  return {
    nodes, connections, selectedNode, selectedNodeId, isConfigPanelOpen, dragState,
    setNodes, setConnections, setSelectedNodeId, setIsConfigPanelOpen, setDragState,
    handleOpenConfig, handleCloseConfig, handleSaveConfig, handleDeleteNode, handleDuplicateNode,
    takeSnapshot, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0
  };
}