"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import WorkflowConnection from "./WorkflowConnection";
import WorkflowNode, { type WorkflowNodeData } from "./WorkflowNode";

type CanvasProps = {
  workflowId: string;
  actions?: ReactNode;
};

export default function Canvas({ workflowId, actions }: CanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("start");

  const nodes = useMemo<WorkflowNodeData[]>(
    () => [
      { id: "start", title: "Inicio", type: "START", x: 120, y: 140 },
      { id: "action-1", title: "Recolectar datos", type: "ACTION", x: 420, y: 140 },
      {
        id: "conditional-1",
        title: "Validar criterios",
        type: "CONDITIONAL",
        x: 740,
        y: 140,
      },
      { id: "action-2", title: "Enviar correo", type: "ACTION", x: 1020, y: 40 },
      { id: "end-1", title: "Finalizar", type: "END", x: 1320, y: 40 },
      { id: "end-2", title: "Cerrar flujo", type: "END", x: 1020, y: 260 },
    ],
    []
  );

  const connections = useMemo(
    () => [
      { from: "start", to: "action-1" },
      { from: "action-1", to: "conditional-1" },
      { from: "conditional-1", to: "action-2" },
      { from: "action-2", to: "end-1" },
      { from: "conditional-1", to: "end-2" },
    ],
    []
  );

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  return (
    <div className="canvas-layout">
      <aside className="canvas-panel">
        <h3 className="panel-title">Tipos de nodo</h3>
        <ul className="panel-list">
          <li className="panel-item">START</li>
          <li className="panel-item">ACTION</li>
          <li className="panel-item">CONDITIONAL</li>
          <li className="panel-item">END</li>
        </ul>
      </aside>

      <section className="canvas-stage">
        <div className="canvas-toolbar">
          <div>
            <p className="hero-kicker">Workflow {workflowId}</p>
            <h2 className="workflows-title">Vista de canvas</h2>
          </div>
          <div className="canvas-actions">
            {actions}
            <span className="canvas-badge">Solo lectura</span>
          </div>
        </div>

        <div className="canvas-scroll" aria-label="Lienzo de workflow">
          <div className="canvas-grid">
            <svg className="canvas-connections" viewBox="0 0 1600 800">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M 0 0 L 6 3 L 0 6" className="connection-arrow" />
                </marker>
              </defs>
              {connections.map((connection) => {
                const from = nodes.find((node) => node.id === connection.from);
                const to = nodes.find((node) => node.id === connection.to);
                if (!from || !to) {
                  return null;
                }
                return (
                  <WorkflowConnection
                    key={`${connection.from}-${connection.to}`}
                    from={from}
                    to={to}
                  />
                );
              })}
            </svg>

            {nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                onSelect={setSelectedNodeId}
              />
            ))}
          </div>
        </div>
      </section>

      <aside className="canvas-panel canvas-panel-right">
        <h3 className="panel-title">Detalle del nodo</h3>
        {selectedNode ? (
          <div className="panel-card">
            <p className="panel-label">Título</p>
            <p className="panel-value">{selectedNode.title}</p>
            <p className="panel-label">Tipo</p>
            <p className="panel-value">{selectedNode.type}</p>
          </div>
        ) : (
          <p className="panel-empty">Selecciona un nodo para ver detalles.</p>
        )}
      </aside>
    </div>
  );
}
