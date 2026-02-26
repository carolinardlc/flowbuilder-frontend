"use client";

import { useEffect, useMemo, useState } from "react";
import { EMPTY_WORKFLOW_CANVAS_SNAPSHOT, loadWorkflowCanvasSnapshot } from "../../../../services/workflowCanvasStorage";
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

const LEGACY_TYPE_MAP: Partial<Record<string, WorkflowNodeType>> = {
  ACTION: "COMMAND",
  HTTP: "HTTP_REQUEST",
};

const normalizeLegacyType = (
  type: WorkflowNodeType | LegacyWorkflowNodeType,
): WorkflowNodeType => (LEGACY_TYPE_MAP[type] ?? type) as WorkflowNodeType;

const buildNodeTypeSummary = (nodes: DetailsCanvasNode[]) => {
  const counts = { ...EMPTY_COUNTS };
  for (const node of nodes) {
    counts[normalizeLegacyType(node.type)] += 1;
  }
  return counts;
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
          <p className="hero-kicker">Resumen</p>
          <h2 className="workflows-title">Estadísticas del workflow</h2>
        </div>
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

    </section>
  );
}
