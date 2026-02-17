import type { NodeConfigStrategy } from "./types";

const conditionalNodeConfig: NodeConfigStrategy = {
  renderConfigForm: ({ config, updateNestedConfig, incomingNodeOptions }) => (
    <div className="config-section">
      <h4 className="config-section-title">Configuración de Condicional</h4>

      <div className="form-group">
        <label className="form-label">Nodo previo</label>
        <select
          className="form-select"
          value={config.config.sourceNodeId ?? ""}
          onChange={(e) => updateNestedConfig("sourceNodeId", e.target.value)}
        >
          <option value="">Selecciona un nodo</option>
          {(incomingNodeOptions ?? []).map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} ({option.type})
            </option>
          ))}
        </select>
      </div>
    </div>
  ),
  validateConfig: (raw) => {
    if ((raw.sourceNodeId ?? "").trim().length === 0) {
      return [
        {
          field: "sourceNodeId",
          message: "Debes seleccionar un nodo previo.",
        },
      ];
    }
    return [];
  },
  normalizeConfig: (raw) => ({
    ...raw,
    conditionExpression: raw.conditionExpression ?? "",
    sourceNodeId: raw.sourceNodeId ?? "",
  }),
};

export default conditionalNodeConfig;
