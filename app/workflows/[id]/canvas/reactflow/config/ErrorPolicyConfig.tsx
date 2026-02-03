"use client";

/**
 * ErrorPolicyConfig - Premium error policy configuration form
 *
 * Features:
 * - Styled select dropdown
 * - Recommendation text based on selected policy
 * - Consistent styling with other config forms
 */

import { AlertTriangle, CheckCircle } from "lucide-react";
import type { ErrorPolicy } from "../types";

type ErrorPolicyConfigProps = {
  policy: ErrorPolicy;
  onChange: (policy: ErrorPolicy) => void;
};

// Styles
const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#374151",
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

export default function ErrorPolicyConfig({
  policy,
  onChange,
}: ErrorPolicyConfigProps) {
  const isStopOnFail = policy === "STOP_ON_FAIL";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Label and Select */}
      <div>
        <label style={labelStyle}>Política de Error</label>
        <select
          value={policy ?? "STOP_ON_FAIL"}
          onChange={(e) => onChange(e.target.value as ErrorPolicy)}
          style={selectStyle}
        >
          <option value="STOP_ON_FAIL">Detener en caso de fallo (STOP_ON_FAIL)</option>
          <option value="CONTINUE_ON_FAIL">Continuar en caso de fallo (CONTINUE_ON_FAIL)</option>
        </select>
      </div>

      {/* Recommendation Box */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 16px",
          background: isStopOnFail ? "#fef3c7" : "#d1fae5",
          border: `1px solid ${isStopOnFail ? "#fbbf24" : "#34d399"}`,
          borderRadius: "8px",
        }}
      >
        {isStopOnFail ? (
          <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
        ) : (
          <CheckCircle size={18} style={{ color: "#059669", flexShrink: 0, marginTop: "1px" }} />
        )}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 500,
              color: isStopOnFail ? "#92400e" : "#065f46",
            }}
          >
            {isStopOnFail ? "Modo Estricto" : "Modo Tolerante"}
          </p>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "12px",
              color: isStopOnFail ? "#a16207" : "#047857",
              lineHeight: 1.4,
            }}
          >
            {isStopOnFail
              ? "Recomendado para flujos críticos donde los errores deben detener la ejecución inmediatamente."
              : "Útil si deseas que el flujo continúe ejecutándose aunque este nodo falle."}
          </p>
        </div>
      </div>
    </div>
  );
}
