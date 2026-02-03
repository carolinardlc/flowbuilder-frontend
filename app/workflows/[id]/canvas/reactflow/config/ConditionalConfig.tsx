"use client";

/**
 * ConditionalConfig - Premium configuration form for Conditional nodes
 *
 * Features from reference design:
 * - Preview block showing the logical expression
 * - Info/Tip alert box explaining TRUE/FALSE outputs
 * - Rich Select component for operators
 * - Colored badges for TRUE/FALSE branches
 */

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import type { ConditionalConfig } from "../types";

type ConditionalConfigProps = {
  config: ConditionalConfig;
  onChange: (config: ConditionalConfig) => void;
};

type ConditionalOperator = "equals" | "notEquals" | "greaterThan" | "lessThan" | "contains" | "notContains";

const operatorLabels: Record<ConditionalOperator, string> = {
  equals: "Igual a (==)",
  notEquals: "Diferente de (!=)",
  greaterThan: "Mayor que (>)",
  lessThan: "Menor que (<)",
  contains: "Contiene",
  notContains: "No contiene",
};

// Shared styles
const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  outline: "none",
  background: "#f9fafb",
  color: "#1f2937",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  outline: "none",
  background: "#f9fafb",
  color: "#1f2937",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: "right 10px center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "16px",
};

const hintStyle: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#6b7280",
};

export default function ConditionalConfigForm({
  config,
  onChange,
}: ConditionalConfigProps) {
  const [localConfig, setLocalConfig] = useState<ConditionalConfig>(config);

  useEffect(() => {
    onChange(localConfig);
  }, [localConfig, onChange]);

  const updateConfig = (partial: Partial<ConditionalConfig>) => {
    setLocalConfig({ ...localConfig, ...partial });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Condition Section Header */}
      <div>
        <h4 style={{
          margin: "0 0 8px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: "#1f2937",
        }}>
          Condición
        </h4>
        <p style={{
          margin: 0,
          fontSize: "13px",
          color: "#6b7280",
          lineHeight: 1.5,
        }}>
          Define la condición que determinará el flujo. Si se cumple, sigue por TRUE; si no, por FALSE.
        </p>
      </div>

      {/* Left Operand */}
      <div>
        <label style={labelStyle}>
          Operando Izquierdo <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          value={localConfig.leftOperand ?? ""}
          onChange={(e) => updateConfig({ leftOperand: e.target.value })}
          placeholder="context.variable o valor"
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = "#9e8bff";
            e.target.style.boxShadow = "0 0 0 3px rgba(158, 139, 255, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.boxShadow = "none";
          }}
        />
        <p style={hintStyle}>
          Puede ser una variable del contexto (ej: context.userId) o un valor literal
        </p>
      </div>

      {/* Operator */}
      <div>
        <label style={labelStyle}>
          Operador <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <select
          value={localConfig.operator ?? "equals"}
          onChange={(e) => updateConfig({ operator: e.target.value as ConditionalOperator })}
          style={selectStyle}
        >
          {Object.entries(operatorLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Right Operand */}
      <div>
        <label style={labelStyle}>
          Operando Derecho <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          value={localConfig.rightOperand ?? ""}
          onChange={(e) => updateConfig({ rightOperand: e.target.value })}
          placeholder="context.variable o valor"
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = "#9e8bff";
            e.target.style.boxShadow = "0 0 0 3px rgba(158, 139, 255, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.boxShadow = "none";
          }}
        />
        <p style={hintStyle}>
          Puede ser una variable del contexto o un valor literal para comparar
        </p>
      </div>

      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Preview Block */}
      <div style={{
        padding: "16px",
        background: "#f3f4f6",
        borderRadius: "8px",
      }}>
        <h4 style={{
          margin: "0 0 8px 0",
          fontSize: "13px",
          fontWeight: 600,
          color: "#374151",
        }}>
          Vista Previa
        </h4>
        <code style={{
          display: "block",
          fontSize: "14px",
          color: "#1f2937",
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
        }}>
          {localConfig.leftOperand || "..."}{" "}
          <span style={{ fontWeight: 700, color: "#9e8bff" }}>
            {operatorLabels[(localConfig.operator as ConditionalOperator) ?? "equals"]}
          </span>{" "}
          {localConfig.rightOperand || "..."}
        </code>

        {/* TRUE/FALSE badges */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginTop: "12px",
        }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: 500,
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "6px",
          }}>
            ✓ TRUE → Continúa por salida TRUE
          </span>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: 500,
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "6px",
          }}>
            ✗ FALSE → Continúa por salida FALSE
          </span>
        </div>
      </div>

      {/* Info Alert Box */}
      <div style={{
        padding: "16px",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}>
          <Info size={18} style={{ color: "#2563eb", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h4 style={{
              margin: "0 0 8px 0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e40af",
            }}>
              Acerca de las salidas
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: "16px",
              fontSize: "12px",
              color: "#1e40af",
              lineHeight: 1.6,
            }}>
              <li>Los nodos CONDITIONAL tienen 2 salidas obligatorias</li>
              <li>Conecta la salida TRUE al nodo que se ejecuta si se cumple</li>
              <li>Conecta la salida FALSE al nodo que se ejecuta si no se cumple</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
