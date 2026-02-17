import type { ReactNode } from "react";
import type { NodeConfig, WorkflowNodeType } from "../../types";

export type NodeConfigValidationError = {
  field: string;
  message: string;
};

export type NormalizedNodeConfig = NodeConfig["config"];

export type NodeConfigRenderContext = {
  config: NodeConfig;
  updateNestedConfig: (path: string, value: string) => void;
  incomingNodeOptions?: { id: string; name: string; type: string }[];
};

export type NodeConfigStrategy = {
  renderConfigForm: (context: NodeConfigRenderContext) => ReactNode;
  validateConfig: (config: NodeConfig["config"]) => NodeConfigValidationError[];
  normalizeConfig: (raw: NodeConfig["config"]) => NormalizedNodeConfig;
};

export type NodeConfigStrategyMap = Record<WorkflowNodeType, NodeConfigStrategy>;
