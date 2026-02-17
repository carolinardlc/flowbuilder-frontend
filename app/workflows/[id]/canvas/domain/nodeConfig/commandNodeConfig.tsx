import type { NodeConfigStrategy } from "./types";

const commandNodeConfig: NodeConfigStrategy = {
  renderConfigForm: ({ config, updateNestedConfig }) => (
    <div className="config-section">
      <h4 className="config-section-title">Configuración de Command</h4>
      <div className="form-group">
        <label className="form-label">Comando</label>
        <textarea
          className="form-textarea"
          value={config.config.command ?? ""}
          onChange={(e) => updateNestedConfig("command", e.target.value)}
          rows={8}
          style={{
            fontSize: "15px",
            minHeight: "180px",
            overflowY: "auto",
            resize: "vertical",
          }}
        />
      </div>
    </div>
  ),
  validateConfig: (raw) => {
    if ((raw.command ?? "").trim().length === 0) {
      return [{ field: "command", message: "El comando es obligatorio." }];
    }
    return [];
  },
  normalizeConfig: (raw) => ({
    ...raw,
    command: raw.command ?? "",
  }),
};

export default commandNodeConfig;
