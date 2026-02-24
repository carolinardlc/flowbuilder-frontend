"use client";

import { useEffect, useMemo, useState } from "react";
import { EMPTY_WORKFLOW_CANVAS_SNAPSHOT, loadWorkflowCanvasSnapshot } from "../../../../services/workflowCanvasStorage";
import WorkflowConnection from "../../canvas/WorkflowConnection";
import WorkflowNode from "../../canvas/WorkflowNode";
import type {
  Connection,
  WorkflowNodeData,
  WorkflowNodeType,
} from "../../canvas/types";

type WorkflowDetailsCanvasProps = {
  workflowId: string;
};

type LegacyWorkflowNodeType = "ACTION" | "HTTP";

type DetailsCanvasNode = WorkflowNodeData & {
  type: WorkflowNodeType | LegacyWorkflowNodeType;
};

type CanvasSnapshot = {
  nodes: DetailsCanvasNode[];
  connections: Connection[];
};

const EMPTY_SNAPSHOT: CanvasSnapshot = EMPTY_WORKFLOW_CANVAS_SNAPSHOT as CanvasSnapshot;

const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  START: "Inicio",
  COMMAND: "Command",
  CONDITIONAL: "Condicional",
  END: "Fin",
  HTTP_REQUEST: "HTTP Request",
};

const EMPTY_COUNTS: Record<WorkflowNodeType, number> = {
  START: 0,
  COMMAND: 0,
  CONDITIONAL: 0,
  END: 0,
  HTTP_REQUEST: 0,
};

const normalizeLegacyType = (type: WorkflowNodeType | LegacyWorkflowNodeType) => {
  if (type === "ACTION") return "COMMAND" as const;
  if (type === "HTTP") return "HTTP_REQUEST" as const;
  return type;
};

const buildNodeTypeSummary = (nodes: DetailsCanvasNode[]) => {
  return nodes.reduce<Record<WorkflowNodeType, number>>((acc, node) => {
    const normalizedType = normalizeLegacyType(node.type);
    acc[normalizedType] = (acc[normalizedType] ?? 0) + 1;
    return acc;
  }, { ...EMPTY_COUNTS });
};

const normalizeSnapshotForDetails = (
  snapshot: ReturnType<typeof loadWorkflowCanvasSnapshot>,
) => {
  if (!snapshot) return EMPTY_SNAPSHOT;
  return {
    nodes: snapshot.nodes as DetailsCanvasNode[],
    connections: snapshot.connections,
  };
};

export default function WorkflowDetailsCanvas({
  workflowId,
}: WorkflowDetailsCanvasProps) {
  const [snapshot, setSnapshot] = useState<CanvasSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    const loadedSnapshot = loadWorkflowCanvasSnapshot(workflowId);
    setSnapshot(normalizeSnapshotForDetails(loadedSnapshot));
  }, [workflowId]);

  const normalizedNodes = useMemo(
    () =>
      snapshot.nodes.map((node) => ({
        ...node,
        type: normalizeLegacyType(node.type),
      })),
    [snapshot.nodes],
  );

  const nodeById = useMemo(
    () => new Map(normalizedNodes.map((node) => [node.id, node])),
    [normalizedNodes],
  );

  const visibleConnections = useMemo(
    () =>
      snapshot.connections.filter(
        (connection) => nodeById.has(connection.from) && nodeById.has(connection.to),
      ),
    [snapshot.connections, nodeById],
  );

  const summary = useMemo(
    () => ({
      totalNodes: normalizedNodes.length,
      totalConnections: visibleConnections.length,
      counts: buildNodeTypeSummary(snapshot.nodes),
    }),
    [normalizedNodes.length, visibleConnections.length, snapshot.nodes],
  );

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
        {(Object.keys(NODE_TYPE_LABELS) as Array<keyof typeof NODE_TYPE_LABELS>).map(
          (type) => (
            <div className="details-stat" key={type}>
              <p className="panel-label">{NODE_TYPE_LABELS[type]}</p>
              <p className="panel-value">{summary.counts[type]}</p>
            </div>
          ),
        )}
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

            {visibleConnections.map((connection) => {
              const from = nodeById.get(connection.from);
              const to = nodeById.get(connection.to);
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

          {normalizedNodes.length === 0 && (
            <div className="canvas-empty">
              No hay nodos guardados para este workflow.
            </div>
          )}

          {normalizedNodes.map((node) => (
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
