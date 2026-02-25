"use client";

import type { Connection, WorkflowNodeData } from "../types";
import { buildConnectionPath } from "../utils/nodeUtils";

type ExecutionLayerProps = {
  connections: Connection[];
  nodes: WorkflowNodeData[];
  isExecuting: boolean;
  executionKey: number;
};

export default function ExecutionLayer({
  connections,
  nodes,
  isExecuting,
  executionKey,
}: ExecutionLayerProps) {
  if (!isExecuting) return null;

  return (
    <svg
      className="canvas-connections execution-layer"
      key={executionKey}
    >
      {connections.map((connection, index) => {
        const path = buildConnectionPath(
          connection.from,
          connection.to,
          nodes,
          connection.fromOffsetY,
        );
        if (!path) return null;

        return (
          <g key={`exec-${connection.id}`}>
            <path d={path} fill="none" stroke="none" />
            <circle className="execution-dot" r="4">
              <animateMotion
                dur="1.2s"
                begin={`${index * 0.2}s`}
                path={path}
                repeatCount="1"
                fill="freeze"
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
