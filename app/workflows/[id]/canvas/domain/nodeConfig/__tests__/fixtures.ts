import type { NodeConfig } from "../../../types";

export const baseConfig = (type: NodeConfig["type"]): NodeConfig => ({
  id: "node-1",
  title: "Nodo",
  type,
  config: {},
});
