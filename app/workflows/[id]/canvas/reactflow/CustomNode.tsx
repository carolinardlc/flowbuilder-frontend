"use client";

// This custom node renders a destination-styled card with handles and inline actions.
// It mirrors the reference UX (duplicate/delete) without introducing new dependencies.

import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import type { CanvasNodeData } from "./canvas-types";

export default function CustomNode({
  id,
  data,
  selected,
}: NodeProps<CanvasNodeData>) {
  const isStartNode = data.nodeType === "START";
  const isConditional = data.nodeType === "CONDITIONAL";

  return (
    <div
      className={`rf-node rf-node-${data.nodeType.toLowerCase()} ${
        selected ? "rf-node-selected" : ""
      }`}
    >
      {/* The top handle is hidden for START nodes to prevent incoming edges. */}
      {!isStartNode ? (
        <Handle
          type="target"
          position={Position.Top}
          className="rf-handle rf-handle-in"
        />
      ) : null}

      <div className="rf-node-header">
        <div className="rf-node-title">{data.label}</div>
        <div className="rf-node-type">{data.nodeType}</div>
      </div>

      <div className="rf-node-footer">
        <span
          className={`rf-node-badge ${
            data.isConfigured ? "rf-node-badge--ok" : "rf-node-badge--warn"
          }`}
        >
          {data.isConfigured ? "Configurado" : "Sin configurar"}
        </span>

        {/* Inline actions keep the UX close to the reference without a dropdown. */}
        {!isStartNode ? (
          <div className="rf-node-actions">
            <button
              type="button"
              className="rf-node-action nodrag"
              onClick={() => data.onDuplicate(id)}
            >
              Duplicar
            </button>
            <button
              type="button"
              className="rf-node-action rf-node-action--danger nodrag"
              onClick={() => data.onDelete(id)}
            >
              Eliminar
            </button>
          </div>
        ) : null}
      </div>

      {/* Conditional nodes expose two outputs for TRUE/FALSE branching. */}
      {isConditional ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Bottom}
            className="rf-handle rf-handle-true"
            style={{ left: "35%" }}
          />
          <Handle
            type="source"
            id="false"
            position={Position.Bottom}
            className="rf-handle rf-handle-false"
            style={{ left: "65%" }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="rf-handle rf-handle-out"
        />
      )}
    </div>
  );
}
