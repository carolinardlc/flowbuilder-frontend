"use client";

/**
 * CustomNode - ReactFlow custom node component for workflow builder
 *
 * This component renders a destination-styled card with:
 * - Connection handles (input at top, output at bottom)
 * - Node title and type display
 * - Configuration status badge
 * - Inline actions (duplicate/delete) for non-START nodes
 * - TRUE/FALSE output indicators for conditional nodes
 *
 * Follows the light theme palette from the destination design.
 */

import { memo } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import type { CanvasNodeData } from "./canvas-types";

/**
 * CustomNode component for rendering workflow nodes in ReactFlow
 * Memoized to prevent unnecessary re-renders during canvas interactions
 */
function CustomNode({ id, data, selected }: NodeProps<CanvasNodeData>) {
  // Determine node type for conditional rendering
  const isStartNode = data.nodeType === "START";
  const isConditional = data.nodeType === "CONDITIONAL";

  return (
    <div
      className={`rf-node rf-node-${data.nodeType.toLowerCase()} ${selected ? "rf-node-selected" : ""
        }`}
    >
      {/* Input handle - Hidden for START nodes as they cannot receive connections */}
      {!isStartNode && (
        <Handle
          type="target"
          position={Position.Top}
          className="rf-handle rf-handle-in"
        />
      )}

      {/* Node header with title and type badge */}
      <div className="rf-node-header">
        <div className="rf-node-title">{data.label}</div>
        <div className="rf-node-type">{data.nodeType}</div>
      </div>

      {/* Node footer with status and actions */}
      <div className="rf-node-footer">
        {/* Configuration status badge */}
        <span
          className={`rf-node-badge ${data.isConfigured ? "rf-node-badge--ok" : "rf-node-badge--warn"
            }`}
        >
          {data.isConfigured ? "Configurado" : "Sin configurar"}
        </span>

        {/* TRUE/FALSE output indicators for conditional nodes */}
        {isConditional && (
          <div className="rf-node-branches">
            <span className="rf-branch rf-branch--true">TRUE</span>
            <span className="rf-branch rf-branch--false">FALSE</span>
          </div>
        )}

        {/* Inline actions - Only for non-START nodes */}
        {!isStartNode && (
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
        )}
      </div>

      {/* Output handles - Conditional nodes have TRUE/FALSE, others have single output */}
      {isConditional ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Bottom}
            className="rf-handle rf-handle-true"
            style={{ left: "30%" }}
          />
          <Handle
            type="source"
            id="false"
            position={Position.Bottom}
            className="rf-handle rf-handle-false"
            style={{ left: "70%" }}
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

// Memoize to prevent unnecessary re-renders during drag operations
export default memo(CustomNode);
