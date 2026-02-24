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

export default function WorkflowsPage() {
  const { workflows, deleteWorkflow } = useWorkflows();
  const [executions, setExecutions] = useState<WorkflowExecutionRecord[]>([]);
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

  const formatExecutionDate = (value: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleString("es-ES");
  };

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
          {workflows.map((workflow) => {
            const status = statusStyles[workflow.status];
            const workflowExecutions = executionsByWorkflow[workflow.id] ?? [];
            return (
              <article key={workflow.id} className="workflow-card">
                <div className="workflow-content">
                  <h2 className="workflow-title">{workflow.name}</h2>
                  <p className="workflow-description">{workflow.description}</p>
                </div>
                <div className="workflow-meta-row">
                  <span className={status.className}>{status.label}</span>
                  <span className="workflow-updated">
                    Actualizado: {workflow.date}
                  </span>
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
                    onClick={() =>
                      setWorkflowToDelete({ id: workflow.id, name: workflow.name })
                    }
                  >
                    Eliminar
                  </button>
                </div>
                <div className="panel-card" style={{ marginTop: "10px" }}>
                  <p className="panel-label">
                    Ejecuciones ({workflowExecutions.length})
                  </p>
                  {workflowExecutions.length === 0 ? (
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
                      {workflowExecutions.slice(0, 5).map((execution) => (
                        <li key={execution.id} style={{ fontSize: "12px" }}>
                          {formatExecutionDate(execution.executedAt)} -{" "}
                          {execution.status === "SUCCESS" ? "OK" : "ERROR"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
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
      </section>
    </Layout>
  );
}
