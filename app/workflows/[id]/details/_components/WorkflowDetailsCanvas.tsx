"use client";

import { useEffect, useMemo, useState } from "react";
import WorkflowConnection from "../../canvas/WorkflowConnection";
import WorkflowNode from "../../canvas/WorkflowNode";
import { STORAGE_KEYS } from "../../canvas/constants/storage";
import type { Connection, WorkflowNodeData, WorkflowNodeType } from "../../canvas/types";

type WorkflowDetailsCanvasProps = {
  workflowId: string;
};

type CanvasSnapshot = {
  nodes: WorkflowNodeData[];
  connections: Connection[];
};

const EMPTY_SNAPSHOT: CanvasSnapshot = { nodes: [], connections: [] };

const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  START: "Inicio",
  ACTION: "Acción",
  CONDITIONAL: "Condicional",
  END: "Fin",
  HTTP: "HTTP",
};

export default function WorkflowDetailsCanvas({
  workflowId,
}: WorkflowDetailsCanvasProps) {
  const [snapshot, setSnapshot] = useState<CanvasSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    const storageKey = STORAGE_KEYS.WORKFLOW_CANVAS(workflowId);
    if (!storageKey) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setSnapshot(EMPTY_SNAPSHOT);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<CanvasSnapshot>;
      setSnapshot({
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
        connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      });
    } catch (error) {
      console.error("Error loading canvas snapshot:", error);
      setSnapshot(EMPTY_SNAPSHOT);
    }
  }, [workflowId]);

  const summary = useMemo(() => {
    const counts = snapshot.nodes.reduce<Record<WorkflowNodeType, number>>(
      (acc, node) => {
        acc[node.type] = (acc[node.type] ?? 0) + 1;
        return acc;
      },
      { START: 0, ACTION: 0, CONDITIONAL: 0, END: 0, HTTP: 0 },
    );

    return {
      totalNodes: snapshot.nodes.length,
      totalConnections: snapshot.connections.length,
      counts,
    };
  }, [snapshot.connections.length, snapshot.nodes]);

  return (
    <section className="details-canvas">
      <div className="details-canvas-header">
        <div>
          <p className="hero-kicker">Resumen visual</p>
          <h2 className="workflows-title">Canvas (solo lectura)</h2>
        </div>
        <span className="canvas-badge">Solo lectura</span>
      </div>

      <div className="details-canvas-summary">
        <div className="details-stat">
          <p className="panel-label">Nodos totales</p>
          <p className="panel-value">{summary.totalNodes}</p>
        </div>
        <div className="details-stat">
          <p className="panel-label">Conexiones</p>
          <p className="panel-value">{summary.totalConnections}</p>
        </div>
        {(
          Object.keys(NODE_TYPE_LABELS) as Array<keyof typeof NODE_TYPE_LABELS>
        ).map((type) => (
          <div className="details-stat" key={type}>
            <p className="panel-label">{NODE_TYPE_LABELS[type]}</p>
            <p className="panel-value">{summary.counts[type]}</p>
          </div>
        ))}
      </div>

      <div className="canvas-scroll canvas-scroll--readonly">
        <div className="canvas-grid canvas-grid--readonly">
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

            {snapshot.connections.map((connection) => {
              const from = snapshot.nodes.find(
                (node) => node.id === connection.from,
              );
              const to = snapshot.nodes.find(
                (node) => node.id === connection.to,
              );
              if (!from || !to) return null;
              return (
                <WorkflowConnection
                  key={connection.id}
                  id={connection.id}
                  from={from}
                  to={to}
                />
              );
            })}
          </svg>

          {snapshot.nodes.length === 0 && (
            <div className="canvas-empty">
              No hay nodos guardados para este workflow.
            </div>
          )}

          {snapshot.nodes.map((node) => (
            <WorkflowNode
              key={node.id}
              node={node}
              selected={false}
              onSelect={() => {}}
              readOnly
            />
          ))}
        </div>
      </div>
    </section>
  );
}
