/**
 * Tipos personalizados para React Flow
 */

import { Node, Edge, NodeTypes, ConnectionMode } from '@xyflow/react';
import type { WorkflowNodeType } from './index';

// Extender el tipo Node de React Flow con nuestras propiedades personalizadas
export interface WorkflowFlowNode extends Node {
  // Propiedades estándar de React Flow
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    // Nuestras propiedades personalizadas
    title: string;
    workflowType: WorkflowNodeType;
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
  };
}

// Edge personalizado para nuestro workflow
export interface WorkflowFlowEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

// Configuración del flujo
export interface ReactFlowConfig {
  connectionMode: ConnectionMode;
  snapToGrid: boolean;
  snapGrid: [number, number];
  defaultViewport: { x: number; y: number; zoom: number };
  minZoom: number;
  maxZoom: number;
  fitView: boolean;
}
