  import commandNodeConfig from "./commandNodeConfig";
  import conditionalNodeConfig from "./conditionalNodeConfig";
  import endNodeConfig from "./endNodeConfig";
  import httpNodeConfig from "./httpNodeConfig";
  import startNodeConfig from "./startNodeConfig";
  import type { NodeConfigStrategyMap } from "./types";

  // Registro único de estrategias: agregar un nodo nuevo solo requiere sumarlo aquí.
  export const nodeConfigStrategies: NodeConfigStrategyMap = {
    START: startNodeConfig,
    COMMAND: commandNodeConfig,
    CONDITIONAL: conditionalNodeConfig,
    HTTP_REQUEST: httpNodeConfig,
    END: endNodeConfig,
  };
