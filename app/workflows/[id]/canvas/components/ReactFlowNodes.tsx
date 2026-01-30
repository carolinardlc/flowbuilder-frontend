// nodes/ReactFlowNodes.tsx
"use client";

/**
 * Componentes de nodos personalizados para @xyflow/react
 * usando tu constants/NODE_TYPES como source of truth.
 */

import { Handle, Position } from "@xyflow/react";
import { NODE_TYPES } from "../constants/nodeTypes";

export type WorkflowFlowNodeData = {
  title: string;
  workflowType: "START" | "ACTION" | "CONDITIONAL" | "END";
  config?: Record<string, any>;
};

const nodeStyles = {
  padding: "12px 20px",
  borderRadius: "12px",
  border: "2px solid",
  minWidth: "160px",
  maxWidth: "200px",
  minHeight: "60px",
  maxHeight: "80px",
  textAlign: "center" as const,
  fontSize: "14px",
  fontWeight: "bold",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  transition: "all 0.2s ease",
  cursor: "grab",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  gap: "4px",
  flexShrink: 0,
  aspectRatio: "2/1",
};

const handleStyles = {
  width: "12px",
  height: "12px",
  border: "2px solid #fff",
  borderRadius: "50%",
};

export function StartNode({ data }: { data: WorkflowFlowNodeData }) {
  const nodeType = NODE_TYPES.START;

  return (
    <div
      style={{
        ...nodeStyles,
        borderColor: nodeType.color,
        backgroundColor: nodeType.bgColor,
        color: "#047857",
        position: "relative",
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ ...handleStyles, background: nodeType.color, opacity: 1 }}
      />

      <div>
        <div style={{ fontSize: "16px", marginBottom: "4px" }}>
          {nodeType.icon}
        </div>
        <div>{data.title}</div>
        <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>
          {nodeType.label}
        </div>
      </div>
    </div>
  );
}

export function ActionNode({ data }: { data: WorkflowFlowNodeData }) {
  const nodeType = NODE_TYPES.ACTION;

  return (
    <div
      style={{
        ...nodeStyles,
        borderColor: nodeType.color,
        backgroundColor: nodeType.bgColor,
        color: "#dc2626",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ ...handleStyles, background: nodeType.color, opacity: 1 }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ ...handleStyles, background: nodeType.color, opacity: 1 }}
      />

      <div>
        <div style={{ fontSize: "16px", marginBottom: "4px" }}>
          {nodeType.icon}
        </div>
        <div>{data.title}</div>
        <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>
          {nodeType.label}
        </div>
        {data.config?.actionType && (
          <div style={{ fontSize: "9px", marginTop: "4px", fontStyle: "italic" }}>
            {String(data.config.actionType)}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConditionalNode({ data }: { data: WorkflowFlowNodeData }) {
  const nodeType = NODE_TYPES.CONDITIONAL;

  return (
    <div
      style={{
        ...nodeStyles,
        borderColor: nodeType.color,
        backgroundColor: nodeType.bgColor,
        color: "#6366f1",
        width: "160px",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ ...handleStyles, background: nodeType.color, opacity: 1 }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ ...handleStyles, background: "#10b981", opacity: 1 }}
        title="TRUE"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ ...handleStyles, background: "#ef4444", opacity: 1 }}
        title="FALSE"
      />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "16px", marginBottom: "4px" }}>
          {nodeType.icon}
        </div>
        <div>{data.title}</div>
        <div style={{ fontSize: "9px", opacity: 0.7 }}>{nodeType.label}</div>
      </div>
    </div>
  );
}

export function EndNode({ data }: { data: WorkflowFlowNodeData }) {
  const nodeType = NODE_TYPES.END;

  return (
    <div
      style={{
        ...nodeStyles,
        borderColor: nodeType.color,
        backgroundColor: nodeType.bgColor,
        color: "#6b7280",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ ...handleStyles, background: nodeType.color, opacity: 1, left: "-8px" }}
      />

      <div>
        <div style={{ fontSize: "16px", marginBottom: "4px" }}>
          {nodeType.icon}
        </div>
        <div>{data.title}</div>
        <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>
          {nodeType.label}
        </div>
        {data.config?.outputType && (
          <div style={{ fontSize: "9px", marginTop: "4px", fontStyle: "italic" }}>
            {String(data.config.outputType)}
          </div>
        )}
      </div>
    </div>
  );
}

export const nodeTypes = {
  start: StartNode,
  action: ActionNode,
  conditional: ConditionalNode,
  end: EndNode,
} as const;
