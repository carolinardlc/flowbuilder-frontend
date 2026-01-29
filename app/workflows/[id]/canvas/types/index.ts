/**
 * Tipos centralizados para el Workflow Canvas
 */

export type WorkflowNodeType = "START" | "ACTION" | "CONDITIONAL" | "END";

export interface WorkflowNodeData {
  id: string;
  title: string;
  type: WorkflowNodeType;
  x: number;
  y: number;
  config?: {
    welcomeMessage?: string;
    actionType?: "http_request" | "send_email" | "database_query" | "webhook";
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: string;
    conditionType?: "if_else" | "switch" | "filter";
    outputType?: "success" | "error" | "notification";
    message?: string;
  };
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface DragState {
  isDragging: boolean;
  draggedNode: string | null;
  dragOffset: { x: number; y: number };
  newNodeType: WorkflowNodeType | null;
  isConnecting: boolean;
  connectionStart: string | null;
  tempConnection: { x: number; y: number } | null;
}

export interface CanvasState {
  nodes: WorkflowNodeData[];
  connections: Connection[];
  selectedNodeId: string | null;
  dragState: DragState;
  isConfigPanelOpen: boolean;
}

export interface NodeConfig {
  id: string;
  title: string;
  type: WorkflowNodeType;
  config: {
    welcomeMessage?: string;
    actionType?: "http_request" | "send_email" | "database_query" | "webhook";
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: string;
    conditionType?: "if_else" | "switch" | "filter";
    outputType?: "success" | "error" | "notification";
    message?: string;
  };
}

export interface CanvasProps {
  workflowId: string;
  actions?: React.ReactNode;
}
