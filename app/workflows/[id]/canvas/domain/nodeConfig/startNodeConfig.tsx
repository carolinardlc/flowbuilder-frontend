import type { NodeConfigStrategy } from "./types";

const startNodeConfig: NodeConfigStrategy = {
  renderConfigForm: () => (
    <div className="config-section">
      <h4 className="config-section-title">Configuración de Inicio</h4>
      <p
        style={{
          fontSize: "13px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        El nodo de inicio no requiere configuración adicional. Solo puedes
        modificar el título del nodo.
      </p>
    </div>
  ),
  validateConfig: () => [],
  normalizeConfig: (raw) => ({ ...raw }),
};

export default startNodeConfig;
