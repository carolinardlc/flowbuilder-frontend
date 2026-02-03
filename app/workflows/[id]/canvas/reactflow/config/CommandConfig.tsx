"use client";

/**
 * CommandConfig - Premium configuration form for Command nodes
 *
 * Features from reference design:
 * - Command input with monospace styling
 * - Argument list builder (add/remove)
 * - Environment Variables key/value editor
 * - Working Directory input
 * - Timeout input
 * - Capture Output toggle
 * - Output Mapping section
 */

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { CommandConfig } from "../types";

type CommandConfigProps = {
  config: CommandConfig;
  onChange: (config: CommandConfig) => void;
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
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  outline: "none",
  background: "#f9fafb",
  color: "#1f2937",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
};

const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  fontSize: "13px",
};

const hintStyle: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "12px",
  color: "#6b7280",
};

const addButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#6b7280",
  cursor: "pointer",
  transition: "all 150ms ease",
};

const removeButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "4px",
  background: "transparent",
  color: "#9ca3af",
  cursor: "pointer",
  transition: "all 150ms ease",
};

const toggleContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  background: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

export default function CommandConfigForm({
  config,
  onChange,
}: CommandConfigProps) {
  const [localConfig, setLocalConfig] = useState<CommandConfig>(config);
  const [newArg, setNewArg] = useState("");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [newMappingKey, setNewMappingKey] = useState("");
  const [newMappingValue, setNewMappingValue] = useState("");

  useEffect(() => {
    onChange(localConfig);
  }, [localConfig, onChange]);

  const updateConfig = (partial: Partial<CommandConfig>) => {
    setLocalConfig({ ...localConfig, ...partial });
  };

  // Arguments management
  const addArgument = () => {
    if (newArg.trim()) {
      updateConfig({
        arguments: [...(localConfig.arguments || []), newArg.trim()],
      });
      setNewArg("");
    }
  };

  const removeArgument = (index: number) => {
    const args = [...(localConfig.arguments || [])];
    args.splice(index, 1);
    updateConfig({ arguments: args });
  };

  // Environment Variables management
  const addEnvVar = () => {
    if (newEnvKey && newEnvValue) {
      updateConfig({
        envVars: { ...(localConfig.envVars || {}), [newEnvKey]: newEnvValue },
      });
      setNewEnvKey("");
      setNewEnvValue("");
    }
  };

  const removeEnvVar = (key: string) => {
    const envVars = { ...(localConfig.envVars || {}) };
    delete envVars[key];
    updateConfig({ envVars });
  };

  // Output Mapping management
  const addMapping = () => {
    if (newMappingKey && newMappingValue) {
      updateConfig({
        outputMapping: { ...(localConfig.outputMapping || {}), [newMappingKey]: newMappingValue },
      });
      setNewMappingKey("");
      setNewMappingValue("");
    }
  };

  const removeMapping = (key: string) => {
    const outputMapping = { ...(localConfig.outputMapping || {}) };
    delete outputMapping[key];
    updateConfig({ outputMapping });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Command */}
      <div>
        <label style={labelStyle}>
          Comando <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          value={localConfig.command ?? ""}
          onChange={(e) => updateConfig({ command: e.target.value })}
          placeholder="ls, npm, python, etc."
          style={monoInputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = "#9e8bff";
            e.target.style.boxShadow = "0 0 0 3px rgba(158, 139, 255, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Arguments */}
      <div>
        <label style={labelStyle}>Argumentos</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(localConfig.arguments || []).map((arg, index) => (
            <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={arg}
                disabled
                style={{ ...monoInputStyle, flex: 1, background: "#f3f4f6" }}
              />
              <button
                type="button"
                onClick={() => removeArgument(index)}
                style={removeButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Agregar argumento..."
              value={newArg}
              onChange={(e) => setNewArg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addArgument()}
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={addArgument}
              style={addButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#9e8bff";
                e.currentTarget.style.color = "#9e8bff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#6b7280";
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div>
        <label style={labelStyle}>Variables de Entorno (opcional)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(localConfig.envVars || {}).map(([key, value]) => (
            <div key={key} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={key}
                disabled
                style={{ ...monoInputStyle, flex: 1, background: "#f3f4f6" }}
              />
              <input
                type="text"
                value={value}
                disabled
                style={{ ...monoInputStyle, flex: 1, background: "#f3f4f6" }}
              />
              <button
                type="button"
                onClick={() => removeEnvVar(key)}
                style={removeButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="KEY"
              value={newEnvKey}
              onChange={(e) => setNewEnvKey(e.target.value)}
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="value"
              value={newEnvValue}
              onChange={(e) => setNewEnvValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEnvVar()}
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={addEnvVar}
              style={addButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#9e8bff";
                e.currentTarget.style.color = "#9e8bff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#6b7280";
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Working Directory */}
      <div>
        <label style={labelStyle}>Directorio de Trabajo (opcional)</label>
        <input
          type="text"
          value={localConfig.workingDirectory ?? ""}
          onChange={(e) => updateConfig({ workingDirectory: e.target.value })}
          placeholder="/path/to/directory"
          style={monoInputStyle}
        />
      </div>

      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Timeout */}
      <div>
        <label style={labelStyle}>Timeout (segundos)</label>
        <input
          type="number"
          min="0"
          value={localConfig.timeout ?? 30}
          onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 0 })}
          style={inputStyle}
        />
      </div>

      {/* Capture Output Toggle */}
      <div style={toggleContainerStyle}>
        <div>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Capturar Salida</label>
          <p style={hintStyle}>
            Captura stdout y stderr del comando
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateConfig({ captureOutput: !localConfig.captureOutput })}
          style={{
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            border: "none",
            background: localConfig.captureOutput ? "#10b981" : "#d1d5db",
            cursor: "pointer",
            position: "relative",
            transition: "background 150ms ease",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "2px",
              left: localConfig.captureOutput ? "22px" : "2px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
              transition: "left 150ms ease",
            }}
          />
        </button>
      </div>

      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Output Mapping (only if captureOutput is enabled) */}
      {localConfig.captureOutput && (
        <div>
          <label style={labelStyle}>Mapeo de Salida → Contexto</label>
          <p style={{ ...hintStyle, marginBottom: "12px" }}>
            Define cómo se almacena la salida del comando en el contexto
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(localConfig.outputMapping || {}).map(([key, value]) => (
              <div key={key} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={key}
                  disabled
                  style={{ ...monoInputStyle, flex: 1, background: "#f3f4f6" }}
                  placeholder="Variable"
                />
                <input
                  type="text"
                  value={value}
                  disabled
                  style={{ ...monoInputStyle, flex: 1, background: "#f3f4f6" }}
                  placeholder="stdout"
                />
                <button
                  type="button"
                  onClick={() => removeMapping(key)}
                  style={removeButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fee2e2";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Variable"
                value={newMappingKey}
                onChange={(e) => setNewMappingKey(e.target.value)}
                style={{ ...monoInputStyle, flex: 1 }}
              />
              <input
                type="text"
                placeholder="stdout, stderr, exitCode"
                value={newMappingValue}
                onChange={(e) => setNewMappingValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMapping()}
                style={{ ...monoInputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={addMapping}
                style={addButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#9e8bff";
                  e.currentTarget.style.color = "#9e8bff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
