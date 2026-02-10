"use client";

import { useState, useCallback, useEffect } from "react";
import { getNodeTypeBadgeClass } from "./constants/nodeTypes";
import type { WorkflowNodeData, NodeConfig } from "./types";

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
  const normalizeConfig = useCallback(
    (nodeType: WorkflowNodeData["type"], raw: NodeConfig["config"]) => {
      if (nodeType === "HTTP_REQUEST") {
        const normalizedErrorPolicy =
          raw.errorPolicy === "STOP_ON_FAIL" ? "STOP" : raw.errorPolicy;
        return {
          ...raw,
          method: raw.method ?? "GET",
          url: raw.url ?? "",
          timeoutMs: raw.timeoutMs ?? "",
          retries: raw.retries ?? "",
          errorPolicy: normalizedErrorPolicy ?? "STOP",
          headers: raw.headers ?? {},
          body: raw.body ?? "",
          httpOutput: raw.httpOutput ?? "",
          outputMapping: raw.outputMapping ?? {},
        };
      }

      if (nodeType === "CONDITIONAL") {
        return {
          ...raw,
          conditionExpression: raw.conditionExpression ?? "",
        };
      }

      if (nodeType === "COMMAND") {
        return {
          ...raw,
          command: raw.command ?? "",
          args: raw.args ?? "",
          input: raw.input ?? "",
          output: raw.output ?? "",
        };
      }

      if (nodeType === "END") {
        return {
          ...raw,
          outputType: raw.outputType ?? "success",
          message: raw.message ?? "",
        };
      }

      return { ...raw };
    },
    [],
  );

  const [config, setConfig] = useState<NodeConfig>(() => ({
    id: node?.id || "",
    title: node?.title || "",
    type: node?.type || "COMMAND",
    config: node ? normalizeConfig(node.type, node.config || {}) : {},
  }));

  // Resetear config cuando cambia el nodo
  useEffect(() => {
    if (node) {
      const newConfig: NodeConfig = {
        id: node.id,
        title: node.title,
        type: node.type,
        config: normalizeConfig(node.type, node.config || {}),
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfig(newConfig);
    }
  }, [node]);

  const updateConfig = useCallback(
    <K extends keyof NodeConfig>(field: K, value: NodeConfig[K]) => {
      setConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const updateNestedConfig = useCallback((path: string, value: string) => {
    setConfig((prev) => {
      const keys = path.split(".");
      const nextConfig = { ...(prev.config ?? {}) } as Record<string, unknown>;

      let current: Record<string, unknown> = nextConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const existing = current[key];

        if (typeof existing !== "object" || existing === null) {
          current[key] = {};
        }

        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;

      return {
        ...prev,
        config: nextConfig,
      };
    });
  }, []);

  const handleSave = useCallback(() => {
    const normalized: NodeConfig = {
      ...config,
      config: normalizeConfig(config.type, config.config),
    };
    onSave(normalized);
    // onClose se llama automáticamente desde el padre en handleSaveConfig
  }, [config, normalizeConfig, onSave]);

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
            <label className="form-label">Nombre de la solicitud</label>
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

          {node.type === "COMMAND" && (
            <div className="config-section">
              <h4 className="config-section-title">Configuración de Command</h4>
              <div className="form-group">
                <label className="form-label">Comando</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.config.command ?? ""}
                  onChange={(e) =>
                    updateNestedConfig("command", e.target.value)
                  }
                  placeholder="Ej: python"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Argumentos</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.config.args ?? ""}
                  onChange={(e) => updateNestedConfig("args", e.target.value)}
                  placeholder="Ej: process.py"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Input (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.config.input ?? ""}
                  onChange={(e) => updateNestedConfig("input", e.target.value)}
                  placeholder="Ej: context.rawData"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Output (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.config.output ?? ""}
                  onChange={(e) => updateNestedConfig("output", e.target.value)}
                  placeholder="Ej: context.cleanedData"
                />
              </div>
            </div>
          )}

          {node.type === "HTTP_REQUEST" && (
            <div className="config-section">
              <h4 className="config-section-title">
                Configuración de HTTP Request
              </h4>

              <div className="form-group">
                <label className="form-label">Método</label>
                <select
                  className="form-select"
                  value={config.config.method ?? "GET"}
                  onChange={(e) => updateNestedConfig("method", e.target.value)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={config.config.url ?? ""}
                  onChange={(e) => updateNestedConfig("url", e.target.value)}
                  placeholder="https://api.example.com/data"
                />
              </div>

              {config.config.method !== "POST" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Timeout (ms)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.config.timeoutMs ?? ""}
                      onChange={(e) =>
                        updateNestedConfig("timeoutMs", e.target.value)
                      }
                      placeholder="5000"
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reintentos</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.config.retries ?? ""}
                      onChange={(e) =>
                        updateNestedConfig("retries", e.target.value)
                      }
                      placeholder="3"
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Política de error</label>
                    <select
                      className="form-select"
                      value={config.config.errorPolicy ?? "STOP"}
                      onChange={(e) =>
                        updateNestedConfig("errorPolicy", e.target.value)
                      }
                    >
                      <option value="STOP">STOP</option>
                      <option value="CONTINUE">CONTINUE</option>
                    </select>
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
