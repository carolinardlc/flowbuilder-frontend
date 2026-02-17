import type { NodeConfigStrategy } from "./types";

const httpNodeConfig: NodeConfigStrategy = {
  renderConfigForm: ({ config, updateNestedConfig }) => (
    <div className="config-section">
      <h4 className="config-section-title">Configuración de HTTP Request</h4>

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
              onChange={(e) => updateNestedConfig("timeoutMs", e.target.value)}
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
              onChange={(e) => updateNestedConfig("retries", e.target.value)}
              placeholder="3"
              min={0}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Política de error</label>
            <select
              className="form-select"
              value={config.config.errorPolicy ?? "STOP"}
              onChange={(e) => updateNestedConfig("errorPolicy", e.target.value)}
            >
              <option value="STOP">STOP</option>
              <option value="CONTINUE">CONTINUE</option>
            </select>
          </div>
        </>
      )}
    </div>
  ),
  validateConfig: (raw) => {
    const errors = [];
    if ((raw.url ?? "").trim().length === 0) {
      errors.push({ field: "url", message: "La URL es obligatoria." });
    }
    if (!raw.method) {
      errors.push({ field: "method", message: "El método es obligatorio." });
    }
    return errors;
  },
  normalizeConfig: (raw) => {
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
  },
};

export default httpNodeConfig;
