"use client";

// This form edits conditional node configuration (left operand, operator, right operand).
// It keeps the UI simple and consistent with destination styles.

import type { ConditionalConfig } from "../types";

type ConditionalConfigProps = {
  config: ConditionalConfig;
  onChange: (config: ConditionalConfig) => void;
};

export default function ConditionalConfigForm({
  config,
  onChange,
}: ConditionalConfigProps) {
  // Helper keeps update calls concise.
  const updateConfig = (partial: Partial<ConditionalConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="rf-inspector-section">
      <div className="rf-form-field">
        <label className="form-label" htmlFor="cond-left">
          Operando izquierdo
        </label>
        <input
          id="cond-left"
          className="form-input"
          placeholder="status"
          value={config.leftOperand}
          onChange={(event) => updateConfig({ leftOperand: event.target.value })}
        />
      </div>

      <div className="rf-form-field">
        <label className="form-label" htmlFor="cond-operator">
          Operador
        </label>
        <select
          id="cond-operator"
          className="form-input rf-select"
          value={config.operator}
          onChange={(event) =>
            updateConfig({
              operator: event.target.value as ConditionalConfig["operator"],
            })
          }
        >
          <option value="equals">Equals</option>
          <option value="notEquals">Not equals</option>
          <option value="greaterThan">Greater than</option>
          <option value="lessThan">Less than</option>
          <option value="contains">Contains</option>
          <option value="notContains">Not contains</option>
        </select>
      </div>

      <div className="rf-form-field">
        <label className="form-label" htmlFor="cond-right">
          Operando derecho
        </label>
        <input
          id="cond-right"
          className="form-input"
          placeholder="OK"
          value={config.rightOperand}
          onChange={(event) =>
            updateConfig({ rightOperand: event.target.value })
          }
        />
      </div>
    </div>
  );
}
