/**
 * Hook personalizado para manejar conexiones entre nodos
 */

import { useCallback } from 'react';
import type { WorkflowNodeData, Connection, DragState } from '../types';
import { DEFAULT_DRAG_STATE, CANVAS_CONFIG } from '../constants/storage';

interface UseConnectionsProps {
  nodes: WorkflowNodeData[];
  connections: Connection[];
  onConnectionsChange: (connections: Connection[]) => void;
  onDragStateChange: (dragState: DragState) => void;
}

export function useConnections({
  nodes,
  connections,
  onConnectionsChange,
  onDragStateChange
}: UseConnectionsProps) {
  
  // Iniciar conexión desde un nodo
  const handleStartConnection = useCallback(
    (nodeId: string) => {
      const startNode = nodes.find((n) => n.id === nodeId);
      if (!startNode) return;

      const startX = startNode.x + CANVAS_CONFIG.CONNECTION_OFFSET_X;
      const startY = startNode.y + CANVAS_CONFIG.CONNECTION_OFFSET_Y;

      onDragStateChange({
        ...DEFAULT_DRAG_STATE,
        isDragging: true,
        isConnecting: true,
        connectionStart: nodeId,
        tempConnection: { x: startX, y: startY },
      });
    },
    [nodes, onDragStateChange],
  );

  // Completar conexión con nodo destino
  const handleCompleteConnection = useCallback(
    (targetNodeId: string, dragState: DragState) => {
      if (!dragState.connectionStart) return;
      if (dragState.connectionStart === targetNodeId) return;

      const fromId = dragState.connectionStart;
      const toId = targetNodeId;

      // Verificar si la conexión ya existe
      const connectionExists = connections.some(
        (c) => c.from === fromId && c.to === toId,
      );

      if (!connectionExists) {
        const newConnection: Connection = {
          id: `c-${Date.now()}`,
          from: fromId,
          to: toId,
        };

        onConnectionsChange([...connections, newConnection]);
      }

      // Resetear estado de conexión
      onDragStateChange(DEFAULT_DRAG_STATE);
    },
    [connections, onConnectionsChange, onDragStateChange],
  );

  // Cancelar conexión activa
  const handleCancelConnection = useCallback(() => {
    onDragStateChange(DEFAULT_DRAG_STATE);
  }, [onDragStateChange]);

  // Eliminar nodo y sus conexiones
  const handleDeleteNode = useCallback(
    (nodeId: string, selectedNodeId: string | null, onNodeSelect: (id: string | null) => void) => {
      onConnectionsChange(
        connections.filter((c) => c.from !== nodeId && c.to !== nodeId),
      );

      if (selectedNodeId === nodeId) {
        onNodeSelect(null);
      }
    },
    [connections, onConnectionsChange],
  );

  return {
    handleStartConnection,
    handleCompleteConnection,
    handleCancelConnection,
    handleDeleteNode,
  };
}
