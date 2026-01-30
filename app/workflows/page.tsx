"use client";

import Link from "next/link";
import { useState } from "react";
import Layout from "../components/Layout";
import { useWorkflows } from "../context/WorkflowsContext";

const statusStyles = {
  DRAFT: { label: "Borrador", className: "badge badge-progress" },
  VALID: { label: "Validado", className: "badge badge-active" },
  INVALID: { label: "Inválido", className: "badge badge-done" },
} as const;

export default function WorkflowsPage() {
  const { workflows, deleteWorkflow } = useWorkflows();

  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

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

        {workflows.length === 0 ? (
          <div className="empty-state">
            <h2 className="workflows-title">Aún no tienes workflows</h2>
            <p className="workflows-subtitle">
              Crea tu primer workflow para empezar.
            </p>
          </div>
        ) : (
          <div className="workflows-grid">
            {workflows.map((workflow) => {
              const status = statusStyles[workflow.status];

              return (
                <article key={workflow.id} className="workflow-card">
                  <div className="workflow-content">
                    <h2 className="workflow-title">{workflow.name}</h2>
                    <p className="workflow-description">{workflow.description}</p>
                  </div>

                  <div className="workflow-meta-row">
                    <span className={status.className}>{status.label}</span>
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
                </article>
              );
            })}
          </div>
        )}

        {workflowToDelete ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <h2 className="workflows-title">Eliminar workflow</h2>
              <p className="workflows-subtitle">
                ¿Estás seguro de que deseas eliminar “{workflowToDelete.name}”?
                Esta acción no se puede deshacer.
              </p>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setWorkflowToDelete(null)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-primary btn-danger"
                  onClick={() => {
                    deleteWorkflow(workflowToDelete.id);
                    setWorkflowToDelete(null);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}
