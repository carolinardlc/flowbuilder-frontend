/**
 * Hook personalizado para manejar drag and drop de nodos
 */

import { useCallback, useRef } from "react";
import type { WorkflowNodeData, WorkflowNodeType, DragState } from "../types";
import { DEFAULT_DRAG_STATE } from "../constants/storage";

interface UseDragAndDropProps {
  nodes: WorkflowNodeData[];
  onNodesChange: (nodes: WorkflowNodeData[]) => void;
  onNodeSelect: (nodeId: string) => void;
  onDragStateChange: (dragState: DragState) => void;
}

export function useDragAndDrop({
  nodes,
  onNodesChange,
  onNodeSelect,
  onDragStateChange,
}: UseDragAndDropProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Iniciar arrastre de un nodo existente
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      onDragStateChange({
        ...DEFAULT_DRAG_STATE,
        isDragging: true,
        draggedNode: nodeId,
        dragOffset: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      });

      onNodeSelect(nodeId);
    },
    [nodes, onDragStateChange, onNodeSelect],
  );

  // Iniciar arrastre desde paleta de nodos
  const handleNodeTypeDragStart = useCallback(
    (nodeType: WorkflowNodeType) => {
      onDragStateChange({
        ...DEFAULT_DRAG_STATE,
        isDragging: true,
        newNodeType: nodeType,
      });
    },
    [onDragStateChange],
  );

  // Manejar movimiento del mouse
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent, dragState: DragState) => {
      if (!dragState.isDragging || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      if (dragState.draggedNode) {
        // Mover nodo existente
        const newX = x - dragState.dragOffset.x;
        const newY = y - dragState.dragOffset.y;

        onNodesChange(
          nodes.map((node) =>
            node.id === dragState.draggedNode
              ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
              : node,
          ),
        );
      } else if (dragState.isConnecting && dragState.connectionStart) {
        // Actualizar conexión temporal
        onDragStateChange({
          ...dragState,
          tempConnection: { x, y },
        });
      }
    },
    [nodes, onNodesChange, onDragStateChange],
  );

  // Manejar liberación del mouse
  const handleCanvasMouseUp = useCallback(
    (_e: React.MouseEvent, dragState: DragState) => {
      if (dragState.isConnecting) {
        return;
      }

      // Resetear estado de drag (la creacion de nodos se maneja en Canvas)
      onDragStateChange(DEFAULT_DRAG_STATE);
    },
    [onDragStateChange],
  );

  return {
    canvasRef,
    handleNodeMouseDown,
    handleNodeTypeDragStart,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  };
}
