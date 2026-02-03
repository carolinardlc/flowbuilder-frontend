"use client";

/**
 * CustomNode - ReactFlow custom node component for workflow builder
 *
 * This component renders a node card with:
 * - SVG icon for each node type
 * - Solid colored header (no transparency)
 * - Colored left border accent
 * - Configuration status badge
 * - TRUE/FALSE output indicators for conditional nodes
 *
 * Uses kid-friendly color palette: mint, rose, lavender, amber
 */

import { memo } from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import type { CanvasNodeData } from "./canvas-types";

// SVG Icons for each node type
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const GitBranchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

// Node type configurations with kid-friendly solid colors
const nodeConfig: Record<string, {
  icon: React.FC;
  headerBg: string;
  borderColor: string;
  iconBg: string;
}> = {
  START: {
    icon: PlayIcon,
    headerBg: "#10b981", // Solid green
    borderColor: "#10b981",
    iconBg: "rgba(255,255,255,0.2)",
  },
  HTTP_REQUEST: {
    icon: GlobeIcon,
    headerBg: "#3b82f6", // Solid blue
    borderColor: "#3b82f6",
    iconBg: "rgba(255,255,255,0.2)",
  },
  COMMAND: {
    icon: TerminalIcon,
    headerBg: "#9e8bff", // Lavender (kid-friendly purple)
    borderColor: "#9e8bff",
    iconBg: "rgba(255,255,255,0.2)",
  },
  CONDITIONAL: {
    icon: GitBranchIcon,
    headerBg: "#f59e0b", // Amber/orange
    borderColor: "#f59e0b",
    iconBg: "rgba(255,255,255,0.2)",
  },
};

/**
 * CustomNode component for rendering workflow nodes in ReactFlow
 */
function CustomNode({ id, data, selected }: NodeProps<CanvasNodeData>) {
  const isStartNode = data.nodeType === "START";
  const isConditional = data.nodeType === "CONDITIONAL";

  const config = nodeConfig[data.nodeType] || nodeConfig.COMMAND;
  const Icon = config.icon;

  return (
    <div
      className={`rf-node ${selected ? "rf-node-selected" : ""}`}
      style={{
        borderColor: config.borderColor,
        borderWidth: "2px",
        borderStyle: "solid",
        borderRadius: "8px",
        minWidth: "180px",
        background: "#ffffff",
        boxShadow: selected
          ? `0 0 0 2px ${config.borderColor}, 0 4px 12px rgba(0,0,0,0.15)`
          : "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Input handle */}
      {!isStartNode && (
        <Handle
          type="target"
          position={Position.Top}
          className="rf-handle rf-handle-in"
        />
      )}

      {/* Node header with icon */}
      <div
        className="rf-node-header"
        style={{
          background: config.headerBg,
          padding: "10px 12px",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            background: config.iconBg,
            borderRadius: "6px",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
          }}
        >
          <Icon />
        </div>
        <div
          className="rf-node-title"
          style={{
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "14px",
            flex: 1,
          }}
        >
          {data.label}
        </div>
      </div>

      {/* Node body */}
      <div
        className="rf-node-body"
        style={{
          padding: "10px 12px",
          background: "#ffffff",
          borderRadius: "0 0 6px 6px",
        }}
      >
        {/* Configuration status badge */}
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 500,
            background: data.isConfigured ? "#d1fae5" : "#fef3c7",
            color: data.isConfigured ? "#065f46" : "#92400e",
          }}
        >
          {data.isConfigured ? "Configurado" : "Sin configurar"}
        </span>

        {/* TRUE/FALSE output indicators for conditional nodes */}
        {isConditional && (
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                background: "#d1fae5",
                color: "#065f46",
              }}
            >
              TRUE
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                background: "#fecaca",
                color: "#991b1b",
              }}
            >
              FALSE
            </span>
          </div>
        )}

        {/* Inline actions */}
        {!isStartNode && (
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button
              type="button"
              className="nodrag"
              onClick={() => data.onDuplicate(id)}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 500,
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                cursor: "pointer",
              }}
            >
              Duplicar
            </button>
            <button
              type="button"
              className="nodrag"
              onClick={() => data.onDelete(id)}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 500,
                background: "#fecaca",
                color: "#991b1b",
                border: "none",
                cursor: "pointer",
              }}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Output handles */}
      {isConditional ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Bottom}
            style={{
              left: "35%",
              background: "#10b981",
              width: "10px",
              height: "10px",
              border: "2px solid #ffffff",
            }}
          />
          <Handle
            type="source"
            id="false"
            position={Position.Bottom}
            style={{
              left: "65%",
              background: "#ef4444",
              width: "10px",
              height: "10px",
              border: "2px solid #ffffff",
            }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="rf-handle rf-handle-out"
          style={{
            background: config.borderColor,
            width: "10px",
            height: "10px",
            border: "2px solid #ffffff",
          }}
        />
      )}
    </div>
  );
}

export default memo(CustomNode);
