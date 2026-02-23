"use client";

import { useState, useCallback, useEffect } from "react";
import { getNodeTypeBadgeClass } from "./constants/nodeTypes";
import type { WorkflowNodeData, NodeConfig } from "./types";
import { nodeConfigStrategies } from "./domain/nodeConfig";

type NodeConfigPanelProps = {
  node: WorkflowNodeData | null;
  onClose: () => void;
  onSave: (config: NodeConfig) => void;
  isOpen: boolean;
  incomingNodeOptions?: { id: string; name: string; type: string }[];
};

const buildNodeConfigState = (node: WorkflowNodeData | null): NodeConfig => {
  if (!node) {
    return {
      id: "",
      title: "",
      type: "COMMAND",
      config: {},
    };
  }

  return {
    id: node.id,
    title: node.title,
    type: node.type,
    config: nodeConfigStrategies[node.type].normalizeConfig(node.config || {}),
  };
};

const getOrCreateNestedObject = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> => {
  const existing = record[key];
  if (typeof existing === "object" && existing !== null) {
    return existing as Record<string, unknown>;
  }

  const next = {};
  record[key] = next;
  return next;
};
const setNestedConfigValue = (
  currentConfig: NodeConfig["config"],
  path: string,
  value: string,
) => {
  const keys = path.split(".");
  const nextConfig = { ...(currentConfig ?? {}) } as Record<string, unknown>;
  let current: Record<string, unknown> = nextConfig;

  for (let i = 0; i < keys.length - 1; i++) {
    current = getOrCreateNestedObject(current, keys[i]);
  }

  current[keys[keys.length - 1]] = value;
  return nextConfig;
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
  incomingNodeOptions,
}: NodeConfigPanelProps) {
  const strategy = node ? nodeConfigStrategies[node.type] : null;
  const [config, setConfig] = useState<NodeConfig>(() => buildNodeConfigState(node));
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Resetear config cuando cambia el nodo
  useEffect(() => {
    if (node) {
      const newConfig = buildNodeConfigState(node);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfig(newConfig);
      setFormErrors([]);
    }
  }, [node]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
      return {
        ...prev,
        config: setNestedConfigValue(prev.config, path, value),
      };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!strategy) return;
    const errors = strategy
      .validateConfig(config.config)
      .map((error) => error.message);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const normalized: NodeConfig = {
      ...config,
      config: strategy.normalizeConfig(config.config),
    };
    onSave(normalized);
    // onClose se llama automáticamente desde el padre en handleSaveConfig
  }, [config, onSave, strategy]);

  if (!isOpen || !node || !strategy) return null;

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
          {strategy.renderConfigForm({
            config,
            updateNestedConfig,
            incomingNodeOptions,
          })}
        </div>

        <div className="config-panel-footer">
          {formErrors.length > 0 && (
            <p className="form-error" style={{ marginRight: "auto" }}>
              {formErrors[0]}
            </p>
          )}
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
