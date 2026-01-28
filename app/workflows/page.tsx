"use client";

import Link from "next/link";
import Layout from "../components/Layout";
import { useWorkflows } from "../context/WorkflowsContext";

const statusStyles = {
  ACTIVE: { label: "Activo", className: "badge badge-active" },
  IN_PROGRESS: { label: "En curso", className: "badge badge-progress" },
  DONE: { label: "Listo", className: "badge badge-done" },
} as const;

export default function WorkflowsPage() {
  const { workflows } = useWorkflows();
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
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}
