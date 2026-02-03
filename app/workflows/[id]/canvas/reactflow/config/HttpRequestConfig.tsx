"use client";

/**
 * HttpRequestConfig - Premium configuration form for HTTP Request nodes
 *
 * Features from reference design:
 * - Method selector (GET, POST, PUT, etc.)
 * - URL input
 * - Key/Value editors for Headers and Query Params
 * - Body editor with Text/JSON toggle
 * - Timeout and Retries inputs
 * - Response mapping section
 */

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { HttpRequestConfig } from "../types";

type HttpRequestConfigProps = {
  config: HttpRequestConfig;
  onChange: (config: HttpRequestConfig) => void;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

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

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "13px",
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  outline: "none",
  background: "#f9fafb",
  color: "#1f2937",
  resize: "vertical",
  minHeight: "100px",
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

const methodColors: Record<HttpMethod, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#8b5cf6",
  DELETE: "#ef4444",
  HEAD: "#6b7280",
  OPTIONS: "#6b7280",
};

export default function HttpRequestConfigForm({
  config,
  onChange,
}: HttpRequestConfigProps) {
  const [localConfig, setLocalConfig] = useState<HttpRequestConfig>(config);
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");
  const [newParamKey, setNewParamKey] = useState("");
  const [newParamValue, setNewParamValue] = useState("");
  const [newMappingKey, setNewMappingKey] = useState("");
  const [newMappingValue, setNewMappingValue] = useState("");

  useEffect(() => {
    onChange(localConfig);
  }, [localConfig, onChange]);

  const updateConfig = (partial: Partial<HttpRequestConfig>) => {
    setLocalConfig({ ...localConfig, ...partial });
  };

  // Headers management
  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      updateConfig({
        headers: { ...localConfig.headers, [newHeaderKey]: newHeaderValue },
      });
      setNewHeaderKey("");
      setNewHeaderValue("");
    }
  };

  const removeHeader = (key: string) => {
    const headers = { ...localConfig.headers };
    delete headers[key];
    updateConfig({ headers });
  };

  // Query Params management
  const addQueryParam = () => {
    if (newParamKey && newParamValue) {
      updateConfig({
        queryParams: { ...localConfig.queryParams, [newParamKey]: newParamValue },
      });
      setNewParamKey("");
      setNewParamValue("");
    }
  };

  const removeQueryParam = (key: string) => {
    const queryParams = { ...localConfig.queryParams };
    delete queryParams[key];
    updateConfig({ queryParams });
  };

  // Response Mapping management
  const addMapping = () => {
    if (newMappingKey && newMappingValue) {
      updateConfig({
        responseMapping: { ...localConfig.responseMapping, [newMappingKey]: newMappingValue },
      });
      setNewMappingKey("");
      setNewMappingValue("");
    }
  };

  const removeMapping = (key: string) => {
    const responseMapping = { ...localConfig.responseMapping };
    delete responseMapping[key];
    updateConfig({ responseMapping });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Method */}
      <div>
        <label style={labelStyle}>
          Método HTTP <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <div style={{ position: "relative" }}>
          <select
            value={localConfig.method ?? "GET"}
            onChange={(e) => updateConfig({ method: e.target.value as HttpMethod })}
            style={{
              ...selectStyle,
              paddingLeft: "40px",
              fontWeight: 600,
              color: methodColors[(localConfig.method as HttpMethod) ?? "GET"],
            }}
          >
            {(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as HttpMethod[]).map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <div style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: methodColors[(localConfig.method as HttpMethod) ?? "GET"],
          }} />
        </div>
      </div>

      {/* URL */}
      <div>
        <label style={labelStyle}>
          URL <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          value={localConfig.url ?? ""}
          onChange={(e) => updateConfig({ url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
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
      </div>

      {/* Headers */}
      <div>
        <label style={labelStyle}>Headers</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(localConfig.headers || {}).map(([key, value]) => (
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
                onClick={() => removeHeader(key)}
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
              placeholder="Key"
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="Value"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHeader()}
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={addHeader}
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

      {/* Query Parameters */}
      <div>
        <label style={labelStyle}>Query Parameters</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(localConfig.queryParams || {}).map(([key, value]) => (
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
                onClick={() => removeQueryParam(key)}
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
              placeholder="Key"
              value={newParamKey}
              onChange={(e) => setNewParamKey(e.target.value)}
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="Value"
              value={newParamValue}
              onChange={(e) => setNewParamValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQueryParam()}
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={addQueryParam}
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

      {/* Body Type */}
      <div>
        <label style={labelStyle}>Tipo de Body</label>
        <select
          value={localConfig.bodyType ?? "text"}
          onChange={(e) => updateConfig({ bodyType: e.target.value as "text" | "json" })}
          style={selectStyle}
        >
          <option value="text">Texto</option>
          <option value="json">JSON</option>
        </select>
      </div>

      {/* Body */}
      <div>
        <label style={labelStyle}>Body</label>
        <textarea
          value={localConfig.body ?? ""}
          onChange={(e) => updateConfig({ body: e.target.value })}
          placeholder={localConfig.bodyType === "json" ? '{"key": "value"}' : "Contenido del body..."}
          style={textareaStyle}
        />
      </div>

      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Timeout & Retries */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={labelStyle}>Timeout (s)</label>
          <input
            type="number"
            min="0"
            value={localConfig.timeout ?? 30}
            onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Reintentos</label>
          <input
            type="number"
            min="0"
            value={localConfig.retries ?? 0}
            onChange={(e) => updateConfig({ retries: parseInt(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Response Mapping */}
      <div>
        <label style={labelStyle}>Mapeo de Respuesta → Contexto</label>
        <p style={{
          margin: "0 0 12px 0",
          fontSize: "12px",
          color: "#6b7280",
        }}>
          Define cómo se almacenan los datos de respuesta en el contexto del workflow
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(localConfig.responseMapping || {}).map(([key, value]) => (
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
                placeholder="response.data.field"
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
              placeholder="response.data.field"
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
    </div>
  );
}
