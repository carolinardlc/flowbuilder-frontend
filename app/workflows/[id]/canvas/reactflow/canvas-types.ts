// This file defines UI-facing data used by the ReactFlow canvas layer.
// It extends the pure workflow contract with callbacks needed by the node UI.

import type { NodeConfig, NodeType } from "./types";

// Canvas node data combines workflow fields with UI interactions.
export type CanvasNodeData = {
  label: string;
  nodeType: NodeType;
  config: NodeConfig;
  isConfigured: boolean;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
};
