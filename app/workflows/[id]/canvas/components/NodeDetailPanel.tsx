"use client";

import type { Connection, WorkflowNodeData } from "../types";

type NodeDetailPanelProps = {
  selectedNode: WorkflowNodeData | null;
  selectedConnectionId: string | null;
  connections: Connection[];
  onOpenConfig: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteConnection: (id: string) => void;
  onDeselectConnection: () => void;
  onExecute: () => void;
  onValidate: () => void;
};

export default function NodeDetailPanel({
  selectedNode,
  selectedConnectionId,
  connections,
  onOpenConfig,
  onDuplicate,
  onDelete,
  onDeleteConnection,
  onDeselectConnection,
  onExecute,
  onValidate,
}: NodeDetailPanelProps) {
  return (
    <aside className="canvas-panel canvas-panel-right canvas-panel-offset">
      <h3 className="panel-title">Detalle del nodo</h3>

      {selectedNode ? (
        <div className="panel-card">
          <p className="panel-label">Título</p>
          <p className="panel-value">{selectedNode.title}</p>

          <p className="panel-label">Tipo</p>
          <p className="panel-value">{selectedNode.type}</p>

          <p className="panel-label">Posición</p>
          <p className="panel-value">
            X: {Math.round(selectedNode.x)}, Y: {Math.round(selectedNode.y)}
          </p>

          <div className="panel-section" style={{ marginTop: "16px" }}>
            <h4 className="panel-title">Conexiones</h4>
            <div style={{ fontSize: "12px" }}>
              <p>
                Salidas:{" "}
                {connections.filter((c) => c.from === selectedNode.id).length}
              </p>
              <p>
                Entradas:{" "}
                {connections.filter((c) => c.to === selectedNode.id).length}
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ marginTop: "8px", width: "100%", fontSize: "12px" }}
              onClick={onOpenConfig}
            >
              ⚙️ Configurar Nodo
            </button>
          </div>

          {selectedNode.type !== "START" && (
            <button
              className="btn-primary"
              style={{ marginTop: "12px", width: "100%" }}
              onClick={() => onDuplicate(selectedNode.id)}
            >
              Duplicar nodo
            </button>
          )}
          <button
            className="btn-primary btn-danger"
            style={{ marginTop: "12px", width: "100%" }}
            onClick={() => onDelete(selectedNode.id)}
          >
            Eliminar nodo
          </button>
        </div>
      ) : selectedConnectionId ? (
        <div className="panel-card">
          <p className="panel-label">Conexión seleccionada</p>
          <p className="panel-value">ID: {selectedConnectionId}</p>
          <button
            className="btn-secondary btn-danger"
            style={{ marginTop: "12px", width: "100%" }}
            onClick={() => {
              onDeleteConnection(selectedConnectionId);
              onDeselectConnection();
            }}
          >
            Eliminar conexión
          </button>
        </div>
      ) : (
        <p className="panel-empty">Selecciona un nodo para ver detalles.</p>
      )}

      <div className="panel-card" style={{ marginTop: "12px" }}>
        <p className="panel-label">Ejecutar</p>
        <button
          className="btn-primary"
          style={{ width: "100%" }}
          onClick={onExecute}
        >
          Ejecutar
        </button>
      </div>

      <div className="panel-card" style={{ marginTop: "12px" }}>
        <p className="panel-label">Validar workflow</p>
        <button
          className="btn-primary"
          style={{ width: "100%" }}
          onClick={onValidate}
        >
          Validar Workflow
        </button>
      </div>
    </aside>
  );
}
