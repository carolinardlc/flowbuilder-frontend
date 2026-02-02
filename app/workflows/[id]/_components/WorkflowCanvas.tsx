import type { ReactNode } from "react";
import ReactFlowCanvas from "../canvas/reactflow/ReactFlowCanvas";

type WorkflowCanvasProps = {
  workflowId: string;
  actions?: ReactNode;
};

export default function WorkflowCanvas({
  workflowId,
  actions,
}: WorkflowCanvasProps) {
  // The ReactFlow canvas now replaces the legacy canvas implementation.
  // Props are kept for compatibility with existing callers.
  return <ReactFlowCanvas />;
}
