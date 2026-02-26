"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import Layout from "../components/Layout";
import { useWorkflows } from "../context/WorkflowsContext";
import {
  loadWorkflowExecutionsFromStorage,
  type WorkflowExecutionRecord,
} from "../services/workflowExecutionsStorage";

const statusStyles = {
  ACTIVE: { label: "Activo", className: "badge badge-active" },
  IN_PROGRESS: { label: "En curso", className: "badge badge-progress" },
  DONE: { label: "Listo", className: "badge badge-done" },
} as const;

type WorkflowExecutionVariable = { key: string; value: unknown };
type WorkflowExecutionOutput = {
  flow: unknown;
  variableList: WorkflowExecutionVariable[];
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const parseExecutionOutput = (rawOutput: string): WorkflowExecutionOutput | null => {
  if (!rawOutput.trim()) return null;

  try {
    const parsed = JSON.parse(rawOutput) as unknown;
    if (!isObjectRecord(parsed)) return null;

    const variableListRaw = parsed.variableList;
    const variableList = Array.isArray(variableListRaw)
      ? variableListRaw
          .filter(isObjectRecord)
          .filter(
            (
              item,
            ): item is {
              key: string;
              value?: unknown;
            } => typeof item.key === "string",
          )
          .map((item) => ({
            key: item.key,
            value: item.value,
          }))
      : [];

    return {
      flow: parsed.flow,
      variableList,
    };
  } catch {
    return null;
  }
};

const getVisibleExecutionVariables = (
  variables: WorkflowExecutionVariable[],
): WorkflowExecutionVariable[] => {
  return variables.filter((variable) => typeof variable.value !== "boolean");
};

const formatExecutionValue = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NaN";
  if (typeof value === "undefined") return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatExecutionDate = (value: string): string => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return parsedDate.toLocaleString("es-ES");
};

// ─────────────────── sub-components ───────────────────

type ExecutionDetailModalProps = {
  execution: WorkflowExecutionRecord;
  workflowNameById: Record<string, string>;
  onClose: () => void;
};

function ExecutionDetailModal({
  execution,
  workflowNameById,
  onClose,
}: ExecutionDetailModalProps) {
  const output = parseExecutionOutput(execution.message);
  const variables = output ? getVisibleExecutionVariables(output.variableList) : [];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card execution-detail-modal">
        <h2 className="workflows-title">Detalle de ejecucion</h2>
        <div className="form-group">
          <p className="panel-label">Execution ID</p>
          <p className="panel-value">{execution.id}</p>
        </div>
        <div className="form-group">
          <p className="panel-label">Workflow</p>
          <p className="panel-value">
            {workflowNameById[execution.workflowId] ?? execution.workflowId}
          </p>
        </div>
        <div className="form-group">
          <p className="panel-label">Fecha</p>
          <p className="panel-value">{formatExecutionDate(execution.executedAt)}</p>
        </div>
        <div className="form-group">
          <p className="panel-label">Estado</p>
          <p className="panel-value">
            {execution.status === "SUCCESS" ? "OK" : "ERROR"}
          </p>
        </div>
        <div className="form-group">
          <label className="form-label">Salida completa</label>
          {output ? (
            <section
              className="execution-output"
              aria-label="Resultado detallado de ejecucion"
            >
              <div className="execution-summary-grid">
                <article className="execution-summary-card">
                  <p className="execution-summary-label">Estado del flujo</p>
                  <p className="execution-summary-value">
                    {output.flow === null ? "No retornado" : "Disponible"}
                  </p>
                </article>
                <article className="execution-summary-card">
                  <p className="execution-summary-label">Variables recibidas</p>
                  <p className="execution-summary-value">{variables.length}</p>
                </article>
              </div>
              {variables.length > 0 ? (
                <div className="execution-variables">
                  <p className="execution-summary-label">Variables</p>
                  <ul className="execution-variables-list">
                    {variables.map((variable) => (
                      <li key={variable.key} className="execution-variable-item">
                        <span className="execution-variable-key">{variable.key}</span>
                        <span className="execution-variable-value">
                          {formatExecutionValue(variable.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : (
            <textarea
              className="form-textarea"
              rows={10}
              readOnly
              value={execution.message}
            />
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

type WorkflowCardProps = {
  workflow: { id: string; name: string; description: string; status: keyof typeof statusStyles; date: string };
  executions: WorkflowExecutionRecord[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelectExecution: (execution: WorkflowExecutionRecord) => void;
  onDeleteClick: () => void;
};

function WorkflowCard({
  workflow,
  executions,
  isExpanded,
  onToggle,
  onSelectExecution,
  onDeleteClick,
}: WorkflowCardProps) {
  const status = statusStyles[workflow.status];

  return (
    <article key={workflow.id} className="workflow-card">
      <div className="workflow-content">
        <h2 className="workflow-title">{workflow.name}</h2>
        <p className="workflow-description">{workflow.description}</p>
      </div>
      <div className="workflow-meta-row">
        <span className={status.className}>{status.label}</span>
        <span className="workflow-updated">Actualizado: {workflow.date}</span>
      </div>
      <div className="workflow-actions">
        <Link
          href={`/workflows/${workflow.id}`}
          className="btn-secondary link-button"
        >
          Abrir
        </Link>
        <Link
          href={`/workflows/${workflow.id}/edit`}
          className="btn-secondary link-button"
        >
          Editar
        </Link>
        <button
          type="button"
          className="btn-secondary btn-danger"
          onClick={onDeleteClick}
        >
          Eliminar
        </button>
      </div>
      <div className="panel-card" style={{ marginTop: "10px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <p className="panel-label" style={{ margin: 0 }}>
            Ejecuciones ({executions.length})
          </p>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 10px" }}
            onClick={onToggle}
          >
            {isExpanded ? "Ocultar" : "Ver"}
          </button>
        </div>
        {isExpanded &&
          (executions.length === 0 ? (
            <p className="panel-empty" style={{ marginTop: "8px" }}>
              Sin ejecuciones registradas.
            </p>
          ) : (
            <ul
              style={{
                marginTop: "8px",
                marginBottom: 0,
                paddingLeft: "18px",
              }}
            >
              {executions.slice(0, 5).map((execution) => (
                <li
                  key={execution.id}
                  style={{
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    {formatExecutionDate(execution.executedAt)} -{" "}
                    {execution.status === "SUCCESS" ? "OK" : "ERROR"}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                    onClick={() => onSelectExecution(execution)}
                  >
                    Ver detalle
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </article>
  );
}

// ─────────────────── page component ───────────────────

export default function WorkflowsPage() {
  const { workflows, deleteWorkflow } = useWorkflows();
  const [executions, setExecutions] = useState<WorkflowExecutionRecord[]>([]);
  const [expandedExecutionWorkflows, setExpandedExecutionWorkflows] = useState<
    Record<string, boolean>
  >({});
  const [selectedExecution, setSelectedExecution] =
    useState<WorkflowExecutionRecord | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const reloadExecutions = () => {
      setExecutions(loadWorkflowExecutionsFromStorage());
    };

    reloadExecutions();
    window.addEventListener("focus", reloadExecutions);
    window.addEventListener("storage", reloadExecutions);
    return () => {
      window.removeEventListener("focus", reloadExecutions);
      window.removeEventListener("storage", reloadExecutions);
    };
  }, []);

  const executionsByWorkflow = useMemo(() => {
    return executions.reduce<Record<string, WorkflowExecutionRecord[]>>(
      (acc, execution) => {
        if (!acc[execution.workflowId]) {
          acc[execution.workflowId] = [];
        }
        acc[execution.workflowId].push(execution);
        return acc;
      },
      {},
    );
  }, [executions]);

  const workflowNameById = useMemo(() => {
    return workflows.reduce<Record<string, string>>((acc, workflow) => {
      acc[workflow.id] = workflow.name;
      return acc;
    }, {});
  }, [workflows]);

  return (
    <Layout>
      <section>
        <div className="workflows-header">
          <div>
            <h1 className="workflows-title">Workflows</h1>
            <p className="workflows-subtitle">
              Gestiona tus flujos y crea uno nuevo.
            </p>
          </div>
          <div className="workflows-actions">
            <Link href="/workflows/new" className="btn-primary link-button">
              Nuevo workflow
            </Link>
          </div>
        </div>

        <div className="workflows-grid">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              executions={executionsByWorkflow[workflow.id] ?? []}
              isExpanded={expandedExecutionWorkflows[workflow.id] ?? false}
              onToggle={() =>
                setExpandedExecutionWorkflows((prev) => ({
                  ...prev,
                  [workflow.id]: !prev[workflow.id],
                }))
              }
              onSelectExecution={setSelectedExecution}
              onDeleteClick={() =>
                setWorkflowToDelete({ id: workflow.id, name: workflow.name })
              }
            />
          ))}
        </div>

        <ConfirmModal
          isOpen={!!workflowToDelete}
          title="Eliminar workflow"
          message={
            workflowToDelete
              ? `Estas seguro de que deseas eliminar "${workflowToDelete.name}"? Esta accion no se puede deshacer.`
              : ""
          }
          confirmLabel="Eliminar"
          onCancel={() => setWorkflowToDelete(null)}
          onConfirm={() => {
            if (!workflowToDelete) return;
            deleteWorkflow(workflowToDelete.id);
            setWorkflowToDelete(null);
          }}
        />

        {selectedExecution && (
          <ExecutionDetailModal
            execution={selectedExecution}
            workflowNameById={workflowNameById}
            onClose={() => setSelectedExecution(null)}
          />
        )}
      </section>
    </Layout>
  );
}
