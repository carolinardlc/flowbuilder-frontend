/**
 * Hook personalizado para manejar el estado principal del Canvas
 */

import { useState, useCallback } from 'react';
import type { WorkflowNodeData, Connection, DragState, NodeConfig } from '../types';
import { DEFAULT_DRAG_STATE } from '../constants/storage';

export function useCanvasState() {
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [dragState, setDragState] = useState<DragState>(DEFAULT_DRAG_STATE);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  // Manejadores del panel de configuración
  const handleOpenConfig = useCallback(() => {
    if (selectedNode) {
      setIsConfigPanelOpen(true);
    }
  }, [selectedNode]);

  const handleCloseConfig = useCallback(() => {
    setIsConfigPanelOpen(false);
  }, []);

  const handleSaveConfig = useCallback((config: NodeConfig) => {
    console.log('Canvas: Recibiendo configuración para guardar:', config);
    setNodes((prev) => {
      const updatedNodes = prev.map((node) =>
        node.id === config.id
          ? {
              ...node,
              title: config.title,
              config: config.config,
            }
          : node,
      );
      console.log('Canvas: Nodos actualizados:', updatedNodes);
      return updatedNodes;
    });
    setIsConfigPanelOpen(false);
  }, []);

  // Eliminar nodo
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) =>
      prev.filter((c) => c.from !== nodeId && c.to !== nodeId),
    );

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  return {
    // Estado
    nodes,
    connections,
    selectedNode,
    selectedNodeId,
    isConfigPanelOpen,
    dragState,
    
    // Setters
    setNodes,
    setConnections,
    setSelectedNodeId,
    setIsConfigPanelOpen,
    setDragState,
    
    // Manejadores de configuración
    handleOpenConfig,
    handleCloseConfig,
    handleSaveConfig,
    handleDeleteNode,
  };
}
