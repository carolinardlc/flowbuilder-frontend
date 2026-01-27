"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { useWorkflows } from "../../context/WorkflowsContext";

type FormState = {
  name: string;
  description: string;
};

export default function NewWorkflowPage() {
  const router = useRouter();
  const { addWorkflow } = useWorkflows();
  const [form, setForm] = useState<FormState>({ name: "", description: "" });
  const [touched, setTouched] = useState({ name: false, description: false });

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
    if (!isFormValid) {
      return;
    }

    addWorkflow({
      id: Date.now().toString(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: "ACTIVE",
      date: formattedDate,
    });

    router.push("/workflows");
  };

  return (
    <Layout>
      <section className="hero">
        <div>
          <p className="hero-kicker">Nuevo flujo</p>
          <h1 className="workflows-title">Crear workflow</h1>
          <p className="workflows-subtitle">
            Define el nombre y la descripción de tu flujo.
          </p>
        </div>

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
              Crear workflow
            </button>
            <Link href="/workflows" className="btn-secondary link-button">
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </Layout>
  );
}
