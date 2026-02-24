import type { NodeConfigStrategy } from "./types";

const normalizeHttpErrorPolicy = (value: unknown) => {
  return value === "STOP_ON_FAIL" ? "STOP" : (value ?? "STOP");
};

const normalizeHttpString = (value: unknown, fallback = "") => {
  return typeof value === "string" ? value : fallback;
};

const normalizeHttpObject = (value: unknown) => {
  return typeof value === "object" && value !== null ? value : {};
};

const buildNormalizedHttpConfig = (
  raw: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    ...raw,
    method: normalizeHttpString(raw.method, "GET"),
    index: normalizeHttpString(raw.index),
    timeoutMs: normalizeHttpString(raw.timeoutMs),
    retries: normalizeHttpString(raw.retries),
    errorPolicy: normalizeHttpErrorPolicy(raw.errorPolicy),
    headers: normalizeHttpObject(raw.headers),
    body: normalizeHttpString(raw.body),
    httpOutput: normalizeHttpString(raw.httpOutput),
    outputMapping: normalizeHttpObject(raw.outputMapping),
  };
};

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
        <label className="form-label">Index</label>
        <select
          className="form-select"
          value={config.config.index ?? ""}
          onChange={(e) => updateNestedConfig("index", e.target.value)}
        >
          <option value="">Selecciona un juego</option>
          <option value="The Legend of Zelda: Breath of the Wild">
            The Legend of Zelda: Breath of the Wild
          </option>
          <option value="Elden Ring">Elden Ring</option>
          <option value="Hollow Knight">Hollow Knight</option>
          <option value="Street Fighter 6">Street Fighter 6</option>
          <option value="Final Fantasy VII Rebirth">
            Final Fantasy VII Rebirth
          </option>
        </select>
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
  ),
  validateConfig: (raw) => {
    const errors = [];
    if ((raw.index ?? "").trim().length === 0) {
      errors.push({ field: "index", message: "El index es obligatorio." });
    }
    if (!raw.method) {
      errors.push({ field: "method", message: "El método es obligatorio." });
    }
    return errors;
  },
  normalizeConfig: (raw) => {
    return buildNormalizedHttpConfig(raw);
  },
};

export default httpNodeConfig;
