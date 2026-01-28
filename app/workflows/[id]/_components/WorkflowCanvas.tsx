import type { ReactNode } from "react";
import Canvas from "../canvas/Canvas";

type WorkflowCanvasProps = {
  workflowId: string;
  actions?: ReactNode;
};

export default function WorkflowCanvas({
  workflowId,
  actions,
}: WorkflowCanvasProps) {
  return <Canvas workflowId={workflowId} actions={actions} />;
}
