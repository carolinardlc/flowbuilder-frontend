/**
 * Tipos centralizados para el Workflow Canvas
 */

export type WorkflowNodeType =
  | "START"
  | "COMMAND"
  | "CONDITIONAL"
  | "END"
  | "HTTP_REQUEST";

export type HttpErrorPolicy = "STOP" | "CONTINUE" | "STOP_ON_FAIL";

export type HttpOutputMapping = Record<string, string>;

export type HttpHeaders = Record<string, string>;

export interface WorkflowNodeData {
  id: string;
  title: string;
  type: WorkflowNodeType;
  x: number;
  y: number;
  config?: {
    method?: "GET" | "POST";
    url?: string;
    timeoutMs?: string;
    retries?: string;
    errorPolicy?: HttpErrorPolicy;
    headers?: HttpHeaders;
    body?: string;
    httpOutput?: string;
    outputMapping?: HttpOutputMapping;
    conditionExpression?: string;
    command?: string;
    args?: string;
    input?: string;
    output?: string;
    outputType?: "success" | "error" | "notification";
    message?: string;
  };
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromOffsetY?: number;
}

export interface DragState {
  isDragging: boolean;
  draggedNode: string | null;
  dragOffset: { x: number; y: number };
  newNodeType: WorkflowNodeType | null;
  isConnecting: boolean;
  connectionStart: string | null;
  connectionStartOffsetY: number | null;
  tempConnection: { x: number; y: number } | null;
  cursorPosition: { x: number; y: number } | null;
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
    method?: "GET" | "POST";
    url?: string;
    timeoutMs?: string;
    retries?: string;
    errorPolicy?: HttpErrorPolicy;
    headers?: HttpHeaders;
    body?: string;
    httpOutput?: string;
    outputMapping?: HttpOutputMapping;
    conditionExpression?: string;
    command?: string;
    args?: string;
    input?: string;
    output?: string;
    outputType?: "success" | "error" | "notification";
    message?: string;
  };
}

export interface CanvasProps {
  workflowId: string;
  actions?: React.ReactNode;
}
