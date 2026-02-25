"use client";

import WorkflowConnection from "../WorkflowConnection";
import type { Connection, DragState, WorkflowNodeData } from "../types";
import { CANVAS_CONFIG } from "../constants/storage";

type CanvasConnectionsLayerProps = {
  connections: Connection[];
  nodes: WorkflowNodeData[];
  dragState: DragState;
  selectedConnectionId: string | null;
  onSelectConnection: (id: string) => void;
};

export default function CanvasConnectionsLayer({
  connections,
  nodes,
  dragState,
  selectedConnectionId,
  onSelectConnection,
}: CanvasConnectionsLayerProps) {
  const startNode = dragState.connectionStart
    ? nodes.find((n) => n.id === dragState.connectionStart)
    : null;

  return (
    <svg className="canvas-connections">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6" className="connection-arrow" />
        </marker>
      </defs>

      {dragState.isConnecting && dragState.tempConnection && startNode && (
        <line
          x1={startNode.x + CANVAS_CONFIG.CONNECTION_OFFSET_X}
          y1={
            startNode.y +
            (dragState.connectionStartOffsetY ?? CANVAS_CONFIG.CONNECTION_OFFSET_Y)
          }
          x2={dragState.tempConnection.x}
          y2={dragState.tempConnection.y}
          stroke="#9e8bff"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.6"
        />
      )}

      {connections.map((connection) => {
        const from = nodes.find((node) => node.id === connection.from);
        const to = nodes.find((node) => node.id === connection.to);
        if (!from || !to) return null;

        return (
          <WorkflowConnection
            key={connection.id}
            id={connection.id}
            from={from}
            to={to}
            fromOffsetY={connection.fromOffsetY}
            isSelected={selectedConnectionId === connection.id}
            onSelect={onSelectConnection}
          />
        );
      })}
    </svg>
  );
}
