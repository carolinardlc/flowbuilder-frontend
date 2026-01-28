"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import { useWorkflows } from "../../../context/WorkflowsContext";

type FormState = {
  name: string;
  description: string;
};

export default function EditWorkflowPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const router = useRouter();
  const { workflows, updateWorkflow } = useWorkflows();
  const workflow = workflows.find((item) => item.id === workflowId);

  const [form, setForm] = useState<FormState>({ name: "", description: "" });
  const [touched, setTouched] = useState({ name: false, description: false });

  useEffect(() => {
    if (workflow) {
      setForm({ name: workflow.name, description: workflow.description });
    }
  }, [workflow]);

  const isNameValid = form.name.trim().length > 0;
  const isDescriptionValid = form.description.trim().length > 0;
  const isFormValid = isNameValid && isDescriptionValid;

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, description: true });
    if (!workflow || !isFormValid) {
      return;
    }

    updateWorkflow({
      ...workflow,
      name: form.name.trim(),
      description: form.description.trim(),
      date: formattedDate,
    });

    router.push("/workflows");
  };

  return (
    <Layout>
      <section className="hero">
        <div>
          <p className="hero-kicker">Editar flujo</p>
          <h1 className="workflows-title">Editar workflow</h1>
          <p className="workflows-subtitle">
            Actualiza el nombre y la descripción de tu flujo.
          </p>
        </div>

        {!workflow ? (
          <div className="app-card">
            <h2 className="feature-title">Workflow no encontrado</h2>
            <p className="feature-text">
              No existe un workflow con este identificador.
            </p>
            <div className="form-actions">
              <Link href="/workflows" className="btn-secondary link-button">
                Volver al listado
              </Link>
            </div>
          </div>
        ) : (
          <form className="app-card form-card" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="workflow-name">
                Nombre del workflow
              </label>
              <input
                id="workflow-name"
                name="name"
                className="form-input"
                placeholder="Ej: Onboarding de clientes"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              />
              {!isNameValid && touched.name ? (
                <p className="form-error">El nombre es obligatorio.</p>
              ) : null}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="workflow-description">
                Descripción
              </label>
              <textarea
                id="workflow-description"
                name="description"
                className="form-textarea"
                placeholder="Describe el objetivo y los pasos clave."
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, description: true }))
                }
              />
              {!isDescriptionValid && touched.description ? (
                <p className="form-error">La descripción es obligatoria.</p>
              ) : null}
            </div>

            <div className="form-actions">
              <button className="btn-primary" type="submit" disabled={!isFormValid}>
                Guardar cambios
              </button>
              <Link href="/workflows" className="btn-secondary link-button">
                Cancelar
              </Link>
            </div>
          </form>
        )}
      </section>
    </Layout>
  );
}
