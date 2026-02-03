"use client";

// This inspector renders configuration and error-policy tabs for the selected node.
// It keeps a local draft so edits can be reviewed before saving to the canvas.

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

type NodeInspectorProps = {
  node: Node<CanvasNodeData> | null;
  onUpdateConfig: (nodeId: string, config: NodeConfig, label: string) => void;
};

type InspectorTab = "config" | "errors";

export default function NodeInspector({
  node,
  onUpdateConfig,
}: NodeInspectorProps) {
  // Tabs are kept local to avoid polluting the canvas state.
  const [activeTab, setActiveTab] = useState<InspectorTab>("config");
  // Draft state allows users to edit fields before explicitly saving.
  const [draftLabel, setDraftLabel] = useState("");
  const [draftConfig, setDraftConfig] = useState<NodeConfig | null>(null);

  // Reset draft state when the selected node changes.
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

  // Determine the node type so we can render the right form.
  const nodeType = node?.data.nodeType ?? null;

  // Derived hint makes the inspector feel responsive to the current node.
  const nodeSubtitle = useMemo(() => {
    if (!node) return "";
    return `Nodo seleccionado: ${node.data.nodeType}`;
  }, [node]);

  // Save button consolidates label + config and passes them to the parent.
  const handleSave = () => {
    if (!node || !draftConfig) return;
    onUpdateConfig(node.id, draftConfig, draftLabel.trim() || node.data.label);
  };

  if (!node) {
    return (
      <div className="rf-panel-inner">
        <p className="panel-title">Inspector</p>
        <div className="panel-card rf-inspector-card">
          <p className="panel-label">Estado</p>
          <p className="panel-value">Selecciona un nodo para editar.</p>
          <p className="panel-label">Tip</p>
          <p className="panel-value">
            El inspector mostrará formularios por tipo de nodo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rf-panel-inner">
      <p className="panel-title">Inspector</p>
      <p className="rf-inspector-subtitle">{nodeSubtitle}</p>

      {/* Tabs are minimal to avoid new dependencies. */}
      <div className="rf-tabs" role="tablist" aria-label="Inspector tabs">
        <button
          className={`rf-tab ${activeTab === "config" ? "rf-tab-active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "config"}
          onClick={() => setActiveTab("config")}
        >
          Configuración
        </button>
        <button
          className={`rf-tab ${activeTab === "errors" ? "rf-tab-active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "errors"}
          onClick={() => setActiveTab("errors")}
        >
          Errores
        </button>
      </div>

      {activeTab === "config" ? (
        <div className="rf-inspector-section">
          <label className="form-label" htmlFor="node-label">
            Título del nodo
          </label>
          <input
            id="node-label"
            className="form-input"
            value={draftLabel ?? ""}
            onChange={(event) => setDraftLabel(event.target.value)}
          />

          {/* Render a type-specific form using the current draft config. */}
          {nodeType === "HTTP_REQUEST" && draftConfig ? (
            <HttpRequestConfigForm
              config={draftConfig as HttpRequestConfig}
              onChange={(config) => setDraftConfig(config)}
            />
          ) : null}
          {nodeType === "COMMAND" && draftConfig ? (
            <CommandConfigForm
              config={draftConfig as CommandConfig}
              onChange={(config) => setDraftConfig(config)}
            />
          ) : null}
          {nodeType === "CONDITIONAL" && draftConfig ? (
            <ConditionalConfigForm
              config={draftConfig as ConditionalConfig}
              onChange={(config) => setDraftConfig(config)}
            />
          ) : null}
          {nodeType === "START" ? (
            <p className="rf-inspector-note">
              El nodo Inicio no requiere configuración adicional.
            </p>
          ) : null}
        </div>
      ) : null}

      {activeTab === "errors" && draftConfig ? (
        <ErrorPolicyConfig
          policy={draftConfig.errorPolicy}
          onChange={(policy) =>
            setDraftConfig({ ...draftConfig, errorPolicy: policy })
          }
        />
      ) : null}

      <div className="rf-inspector-actions">
        <button className="btn-primary" type="button" onClick={handleSave}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
