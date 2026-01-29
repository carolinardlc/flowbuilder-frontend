/**
 * Componentes de nodos personalizados para React Flow
 */

import { Handle, Position } from "@xyflow/react";
import type { WorkflowFlowNode } from "../types/reactFlow";
import { NODE_TYPES } from "../constants/nodeTypes";

// Estilos inline para los nodos - MEJORADOS
const nodeStyles = {
  padding: "12px 20px",
  borderRadius: "12px",
  border: "2px solid",
  minWidth: "160px",
  maxWidth: "200px",
  minHeight: "60px",
  maxHeight: "80px", // Altura máxima para evitar estiramiento
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
  // Prevenir estiramiento en zoom
  flexShrink: 0,
  aspectRatio: "2/1", // Proporción fija
};

// Estilos para handles (puntos de conexión) - MÍNIMOS
const handleStyles = {
  width: "12px",
  height: "12px",
  border: "2px solid #fff",
  borderRadius: "50%",
};

// Estilos para handles hover
const handleHoverStyles = {
  transform: "scale(1.3)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.7)",
};

/**
 * Nodo START para React Flow
 */
export function StartNode({ data }: { data: WorkflowFlowNode["data"] }) {
  const nodeType = NODE_TYPES.START;

  console.log("🚀 Renderizando StartNode con data:", data);

  return (
    <div
      style={{
        ...nodeStyles,
        borderColor: nodeType.color,
        backgroundColor: nodeType.bgColor,
        color: "#047857",
        position: "relative", // Importante para handles
      }}
    >
      {/* Handle de salida - Handle REAL de React Flow */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          ...handleStyles,
          background: nodeType.color,
          opacity: 1,
          cursor: "crosshair",
        }}
        title="Punto de conexión de salida"
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

/**
 * Nodo ACTION para React Flow
 */
export function ActionNode({ data }: { data: WorkflowFlowNode["data"] }) {
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
      {/* Handle de entrada - puede recibir conexiones */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          ...handleStyles,
          background: nodeType.color,
          opacity: 1,
          cursor: "crosshair",
        }}
        title="Punto de conexión de entrada"
      />

      {/* Handle de salida - puede enviar conexiones */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          ...handleStyles,
          background: nodeType.color,
          opacity: 1,
          cursor: "crosshair",
        }}
        title="Punto de conexión de salida"
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
          <div
            style={{ fontSize: "9px", marginTop: "4px", fontStyle: "italic" }}
          >
            {data.config.actionType}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Nodo CONDITIONAL para React Flow
 */
export function ConditionalNode({ data }: { data: WorkflowFlowNode["data"] }) {
  const nodeType = NODE_TYPES.CONDITIONAL;

  return (
    <div
      style={{
        ...nodeStyles,
        borderColor: nodeType.color,
        backgroundColor: nodeType.bgColor,
        color: "#6366f1",
        // Forma rectangular como los demás nodos
        width: "160px",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          ...handleStyles,
          background: nodeType.color,
          opacity: 1,
          cursor: "crosshair",
        }}
      />

      {/* Handle de salida verdadero */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{
          ...handleStyles,
          background: "#10b981",
          opacity: 1,
          cursor: "crosshair",
        }}
      />

      {/* Handle de salida falso */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{
          ...handleStyles,
          background: "#ef4444",
          opacity: 1,
          cursor: "crosshair",
        }}
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

/**
 * Nodo END para React Flow
 */
export function EndNode({ data }: { data: WorkflowFlowNode["data"] }) {
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
      {/* Handle de entrada - solo puede recibir conexiones */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          ...handleStyles,
          background: nodeType.color,
          left: "-8px", // Moverlo fuera del nodo
        }}
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
          <div
            style={{ fontSize: "9px", marginTop: "4px", fontStyle: "italic" }}
          >
            {data.config.outputType}
          </div>
        )}
      </div>
    </div>
  );
}

// Tipos de nodos para React Flow
export const nodeTypes = {
  start: StartNode,
  action: ActionNode,
  conditional: ConditionalNode,
  end: EndNode,
};
