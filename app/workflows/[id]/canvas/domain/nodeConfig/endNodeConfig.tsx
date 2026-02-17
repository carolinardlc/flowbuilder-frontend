import type { NodeConfigStrategy } from "./types";

const endNodeConfig: NodeConfigStrategy = {
  renderConfigForm: ({ config, updateNestedConfig }) => (
    <div className="config-section">
      <h4 className="config-section-title">Configuración de Fin</h4>
      <div className="form-group">
        <label className="form-label">Tipo de Salida</label>
        <select
          className="form-select"
          value={config.config.outputType || "success"}
          onChange={(e) => updateNestedConfig("outputType", e.target.value)}
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
          onChange={(e) => updateNestedConfig("message", e.target.value)}
          placeholder="Workflow completado exitosamente"
          rows={3}
        />
      </div>
    </div>
  ),
  validateConfig: (raw) => {
    const errors = [];
    if ((raw.outputType ?? "").trim().length === 0) {
      errors.push({ field: "outputType", message: "Tipo de salida requerido." });
    }
    if ((raw.message ?? "").trim().length === 0) {
      errors.push({ field: "message", message: "Mensaje requerido." });
    }
    return errors;
  },
  normalizeConfig: (raw) => ({
    ...raw,
    outputType: raw.outputType ?? "success",
    message: raw.message ?? "",
  }),
};

export default endNodeConfig;
