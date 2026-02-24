import type {
  NodeConfigRenderContext,
  NodeConfigStrategy,
  NodeConfigValidationError,
} from "./types";
import type { HttpErrorPolicy, NodeConfig } from "../../types";

const DEFAULT_HTTP_METHOD = "GET";
const DEFAULT_HTTP_ERROR_POLICY = "STOP";
const HTTP_METHOD_POST = "POST";

const HTTP_INDEX_OPTIONS = [
  "The Legend of Zelda: Breath of the Wild",
  "Elden Ring",
  "Hollow Knight",
  "Street Fighter 6",
  "Final Fantasy VII Rebirth",
] as const;

const normalizeHttpMethod = (value: unknown): "GET" | "POST" =>
  value === HTTP_METHOD_POST ? HTTP_METHOD_POST : "GET";

const normalizeHttpErrorPolicy = (value: unknown): HttpErrorPolicy => {
  if (value === "CONTINUE") return "CONTINUE";
  if (value === "STOP_ON_FAIL") return "STOP";
  return "STOP";
};

const normalizeHttpString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const normalizeStringRecord = (value: unknown): Record<string, string> => {
  if (typeof value !== "object" || value === null) return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") {
      result[key] = entry;
    }
  }
  return result;
};

const buildNormalizedHttpConfig = (raw: NodeConfig["config"]): NodeConfig["config"] => ({
  ...raw,
  method: normalizeHttpMethod(raw.method),
  index: normalizeHttpString(raw.index),
  timeoutMs: normalizeHttpString(raw.timeoutMs),
  retries: normalizeHttpString(raw.retries),
  errorPolicy: normalizeHttpErrorPolicy(raw.errorPolicy),
  headers: normalizeStringRecord(raw.headers),
  body: normalizeHttpString(raw.body),
  httpOutput: normalizeHttpString(raw.httpOutput),
  outputMapping: normalizeStringRecord(raw.outputMapping),
});

const renderMethodField = ({
  config,
  updateNestedConfig,
}: NodeConfigRenderContext) => (
  <div className="form-group">
    <label className="form-label">Método</label>
    <select
      className="form-select"
      value={config.config.method ?? DEFAULT_HTTP_METHOD}
      onChange={(e) => updateNestedConfig("method", e.target.value)}
    >
      <option value="GET">GET</option>
      <option value={HTTP_METHOD_POST}>POST</option>
    </select>
  </div>
);

const renderIndexField = ({
  config,
  updateNestedConfig,
}: NodeConfigRenderContext) => (
  <div className="form-group">
    <label className="form-label">Index</label>
    <select
      className="form-select"
      value={config.config.index ?? ""}
      onChange={(e) => updateNestedConfig("index", e.target.value)}
    >
      <option value="">Selecciona un juego</option>
      {HTTP_INDEX_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const renderHttpNumberField = ({
  label,
  field,
  value,
  placeholder,
  updateNestedConfig,
}: {
  label: string;
  field: "timeoutMs" | "retries";
  value: string;
  placeholder: string;
  updateNestedConfig: NodeConfigRenderContext["updateNestedConfig"];
}) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      type="number"
      className="form-input"
      value={value}
      onChange={(e) => updateNestedConfig(field, e.target.value)}
      placeholder={placeholder}
      min={0}
    />
  </div>
);

const renderErrorPolicyField = ({
  config,
  updateNestedConfig,
}: NodeConfigRenderContext) => (
  <div className="form-group">
    <label className="form-label">Política de error</label>
    <select
      className="form-select"
      value={config.config.errorPolicy ?? DEFAULT_HTTP_ERROR_POLICY}
      onChange={(e) => updateNestedConfig("errorPolicy", e.target.value)}
    >
      <option value="STOP">STOP</option>
      <option value="CONTINUE">CONTINUE</option>
    </select>
  </div>
);

const renderNonPostFields = (context: NodeConfigRenderContext) => (
  <>
    {renderHttpNumberField({
      label: "Timeout (ms)",
      field: "timeoutMs",
      value: context.config.config.timeoutMs ?? "",
      placeholder: "5000",
      updateNestedConfig: context.updateNestedConfig,
    })}
    {renderHttpNumberField({
      label: "Reintentos",
      field: "retries",
      value: context.config.config.retries ?? "",
      placeholder: "3",
      updateNestedConfig: context.updateNestedConfig,
    })}
    {renderErrorPolicyField(context)}
  </>
);

const renderConfigForm = (context: NodeConfigRenderContext) => {
  const isPostMethod = context.config.config.method === HTTP_METHOD_POST;

  return (
    <div className="config-section">
      <h4 className="config-section-title">Configuración de HTTP Request</h4>
      {renderMethodField(context)}
      {renderIndexField(context)}
      {!isPostMethod && renderNonPostFields(context)}
    </div>
  );
};

const validateHttpConfig = (raw: NodeConfig["config"]): NodeConfigValidationError[] => {
  const errors: NodeConfigValidationError[] = [];

  if (normalizeHttpString(raw.index).trim().length === 0) {
    errors.push({ field: "index", message: "El index es obligatorio." });
  }

  if (normalizeHttpString(raw.method).trim().length === 0) {
    errors.push({ field: "method", message: "El método es obligatorio." });
  }

  return errors;
};

const httpNodeConfig: NodeConfigStrategy = {
  renderConfigForm,
  validateConfig: validateHttpConfig,
  normalizeConfig: (raw) => buildNormalizedHttpConfig(raw),
};

export default httpNodeConfig;
