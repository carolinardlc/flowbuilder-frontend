"use client";

import { useState, useCallback, useEffect } from "react";
import { getNodeTypeBadgeClass } from "./constants/nodeTypes";
import type { WorkflowNodeData, WorkflowNodeType, NodeConfig } from "./types";

type NodeConfigPanelProps = {
  node: WorkflowNodeData | null;
  onClose: () => void;
  onSave: (config: NodeConfig) => void;
  isOpen: boolean;
};

/**
 * Panel de configuración para nodos de workflow
 *
 * Proporciona una interfaz para configurar las propiedades específicas
 * de cada tipo de nodo según sus necesidades.
 */
export default function NodeConfigPanel({
  node,
  onClose,
  onSave,
  isOpen,
}: NodeConfigPanelProps) {
  const [config, setConfig] = useState<NodeConfig>(() => ({
    id: node?.id || "",
    title: node?.title || "",
    type: node?.type || "ACTION",
    config: node?.config || {},
  }));

  // Resetear config cuando cambia el nodo
  useEffect(() => {
    if (node) {
      const newConfig = {
        id: node.id,
        title: node.title,
        type: node.type,
        config: node.config || {},
      };
      console.log(
        "NodeConfigPanel: Cargando configuración del nodo:",
        newConfig,
      );
      setConfig(newConfig);
    }
  }, [node]);

  const updateConfig = useCallback((field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateNestedConfig = useCallback((path: string, value: any) => {
    setConfig((prev) => {
      const keys = path.split(".");
      const newConfig = { ...prev };
      let current: any = newConfig.config;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  }, []);

  const handleSave = useCallback(() => {
    console.log("Guardando configuración:", config);
    onSave(config);
    // onClose se llama automáticamente desde el padre en handleSaveConfig
  }, [config, onSave]);

  if (!isOpen || !node) return null;

  return (
    <div className="config-panel-overlay">
      <div className="config-panel">
        <div className="config-panel-header">
          <div className="config-panel-title">
            <span className={getNodeTypeBadgeClass(node.type)}>
              {node.type}
            </span>
            <h3>Configurar Nodo</h3>
          </div>
          <button className="config-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="config-panel-body">
          <div className="form-group">
            <label className="form-label">Título del Nodo</label>
            <input
              type="text"
              className="form-input"
              value={config.title}
              onChange={(e) => updateConfig("title", e.target.value)}
            />
          </div>

          {node.type === "START" && (
            <div className="config-section">
              <h4 className="config-section-title">Configuración de Inicio</h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "16px",
                }}
              >
                El nodo de inicio no requiere configuración adicional. Solo
                puedes modificar el título del nodo.
              </p>
            </div>
          )}

          {node.type === "ACTION" && (
            <div className="config-section">
              <h4 className="config-section-title">Configuración de Acción</h4>
              <div className="form-group">
                <label className="form-label">Tipo de Acción</label>
                <select
                  className="form-select"
                  value={config.config.actionType || "http_request"}
                  onChange={(e) =>
                    updateNestedConfig("actionType", e.target.value)
                  }
                >
                  <option value="http_request">HTTP Request</option>
                  <option value="send_email">Send Email</option>
                  <option value="database_query">Database Query</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>

              {config.config.actionType === "http_request" && (
                <>
                  <div className="form-group">
                    <label className="form-label">URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={config.config.url || ""}
                      onChange={(e) =>
                        updateNestedConfig("url", e.target.value)
                      }
                      placeholder="https://api.example.com/endpoint"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Método</label>
                    <select
                      className="form-select"
                      value={config.config.method || "GET"}
                      onChange={(e) =>
                        updateNestedConfig("method", e.target.value)
                      }
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Body (JSON)</label>
                    <textarea
                      className="form-textarea"
                      value={config.config.body || ""}
                      onChange={(e) =>
                        updateNestedConfig("body", e.target.value)
                      }
                      placeholder='{"key": "value"}'
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {node.type === "END" && (
            <div className="config-section">
              <h4 className="config-section-title">Configuración de Fin</h4>
              <div className="form-group">
                <label className="form-label">Tipo de Salida</label>
                <select
                  className="form-select"
                  value={config.config.outputType || "success"}
                  onChange={(e) =>
                    updateNestedConfig("outputType", e.target.value)
                  }
                >
                  <option value="success">Éxito</option>
                  <option value="error">Error</option>
                  <option value="notification">Notificación</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mensaje</label>
                <textarea
                  className="form-textarea"
                  value={config.config.message || ""}
                  onChange={(e) =>
                    updateNestedConfig("message", e.target.value)
                  }
                  placeholder="Workflow completado exitosamente"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <div className="config-panel-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
