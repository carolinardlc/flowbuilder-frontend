"use client";

/**
 * NodeInspector - Premium inspector panel for node configuration
 *
 * Design based on Workflow Builder UI Design reference:
 * - Large centered Settings icon for empty state
 * - Header with node label and type
 * - Underline-style tabs
 * - Dashed border container for START node
 */

import { useEffect, useMemo, useState } from "react";
import type { Node } from "reactflow";
import type { CanvasNodeData } from "./canvas-types";
import type {
  CommandConfig,
  ConditionalConfig,
  HttpRequestConfig,
  NodeConfig,
} from "./types";
import HttpRequestConfigForm from "./config/HttpRequestConfig";
import CommandConfigForm from "./config/CommandConfig";
import ConditionalConfigForm from "./config/ConditionalConfig";
import ErrorPolicyConfig from "./config/ErrorPolicyConfig";

// SVG Icons
const SettingsIcon = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

type NodeInspectorProps = {
  node: Node<CanvasNodeData> | null;
  onUpdateConfig: (nodeId: string, config: NodeConfig, label: string) => void;
};

type InspectorTab = "config" | "errors";

export default function NodeInspector({
  node,
  onUpdateConfig,
}: NodeInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("config");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftConfig, setDraftConfig] = useState<NodeConfig | null>(null);

  useEffect(() => {
    if (node) {
      setDraftLabel(node.data.label);
      setDraftConfig(node.data.config);
      setActiveTab("config");
    } else {
      setDraftLabel("");
      setDraftConfig(null);
    }
  }, [node]);

  const nodeType = node?.data.nodeType ?? null;

  const handleSave = () => {
    if (!node || !draftConfig) return;
    onUpdateConfig(node.id, draftConfig, draftLabel.trim() || node.data.label);
  };

  // Empty state with large centered icon
  if (!node) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#ffffff",
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          textAlign: "center",
        }}>
          <div>
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
              color: "#9ca3af",
            }}>
              <SettingsIcon size={48} />
            </div>
            <h4 style={{
              margin: "0 0 8px 0",
              fontSize: "16px",
              fontWeight: 600,
              color: "#1f2937",
            }}>
              Inspector de Nodos
            </h4>
            <p style={{
              margin: 0,
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: 1.5,
            }}>
              Selecciona un nodo en el canvas para ver y editar su configuración
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tab button style helper
  const getTabStyle = (tab: InspectorTab) => ({
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 500,
    color: activeTab === tab ? "#1f2937" : "#6b7280",
    background: "transparent",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #9e8bff" : "2px solid transparent",
    cursor: "pointer",
    transition: "all 150ms ease",
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#ffffff",
    }}>
      {/* Header with node info */}
      <div style={{
        padding: "16px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <h3 style={{
          margin: "0 0 4px 0",
          fontSize: "16px",
          fontWeight: 600,
          color: "#1f2937",
        }}>
          {node.data.label}
        </h3>
        <p style={{
          margin: 0,
          fontSize: "13px",
          color: "#6b7280",
        }}>
          {node.data.nodeType}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {nodeType === "START" ? (
          // START node message
          <div style={{ padding: "16px" }}>
            <div style={{
              padding: "24px",
              border: "2px dashed #e5e7eb",
              borderRadius: "8px",
              textAlign: "center",
            }}>
              <p style={{
                margin: 0,
                fontSize: "14px",
                color: "#6b7280",
              }}>
                El nodo START no requiere configuración. Es el punto de entrada del workflow.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid #e5e7eb",
              background: "transparent",
            }}>
              <button
                type="button"
                style={getTabStyle("config")}
                onClick={() => setActiveTab("config")}
              >
                Configuración
              </button>
              <button
                type="button"
                style={getTabStyle("errors")}
                onClick={() => setActiveTab("errors")}
              >
                Errores
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "config" && (
              <div style={{ padding: "16px" }}>
                {/* Node label input */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                  }}>
                    Título del nodo
                  </label>
                  <input
                    type="text"
                    value={draftLabel ?? ""}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      outline: "none",
                      background: "#f9fafb",
                      color: "#1f2937",
                      transition: "border-color 150ms ease",
                    }}
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

                {/* Type-specific config form */}
                {nodeType === "HTTP_REQUEST" && draftConfig && (
                  <HttpRequestConfigForm
                    config={draftConfig as HttpRequestConfig}
                    onChange={(config) => setDraftConfig(config)}
                  />
                )}
                {nodeType === "COMMAND" && draftConfig && (
                  <CommandConfigForm
                    config={draftConfig as CommandConfig}
                    onChange={(config) => setDraftConfig(config)}
                  />
                )}
                {nodeType === "CONDITIONAL" && draftConfig && (
                  <ConditionalConfigForm
                    config={draftConfig as ConditionalConfig}
                    onChange={(config) => setDraftConfig(config)}
                  />
                )}
              </div>
            )}

            {activeTab === "errors" && draftConfig && (
              <div style={{ padding: "16px" }}>
                <ErrorPolicyConfig
                  policy={draftConfig.errorPolicy}
                  onChange={(policy) =>
                    setDraftConfig({ ...draftConfig, errorPolicy: policy })
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Save button */}
      {nodeType !== "START" && (
        <div style={{
          padding: "16px",
          borderTop: "1px solid #e5e7eb",
        }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              background: "#10b981",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10b981";
            }}
          >
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  );
}
