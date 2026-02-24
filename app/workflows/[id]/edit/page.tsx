"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../../../components/ConfirmModal";
import Layout from "../../../components/Layout";
import { useWorkflows } from "../../../context/WorkflowsContext";
import { formatDateEs } from "../../../utils/formatDate";
import WorkflowForm, {
  type WorkflowFormTouched,
  type WorkflowFormValues,
} from "../../_components/WorkflowForm";

export default function EditWorkflowPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const router = useRouter();
  const { workflows, updateWorkflow, deleteWorkflow } = useWorkflows();
  const workflow = workflows.find((item) => item.id === workflowId);

  const [form, setForm] = useState<WorkflowFormValues>({
    name: "",
    description: "",
  });
  const [touched, setTouched] = useState<WorkflowFormTouched>({
    name: false,
    description: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (workflow) {
      setForm({ name: workflow.name, description: workflow.description });
    }
  }, [workflow]);

  const isNameValid = form.name.trim().length > 0;
  const isDescriptionValid = form.description.trim().length > 0;
  const isFormValid = isNameValid && isDescriptionValid;

  const formattedDate = useMemo(() => {
    return formatDateEs();
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
            Actualiza el nombre y la descripcion de tu flujo.
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
          <WorkflowForm
            form={form}
            touched={touched}
            isNameValid={isNameValid}
            isDescriptionValid={isDescriptionValid}
            isFormValid={isFormValid}
            submitLabel="Guardar cambios"
            onSubmit={handleSubmit}
            onFieldChange={(field, value) =>
              setForm((prev) => ({ ...prev, [field]: value }))
            }
            onFieldBlur={(field) =>
              setTouched((prev) => ({ ...prev, [field]: true }))
            }
            onDelete={() => setShowDeleteModal(true)}
          />
        )}

        <ConfirmModal
          isOpen={!!workflow && showDeleteModal}
          title="Eliminar workflow"
          message={
            workflow
              ? `Estas seguro de que deseas eliminar "${workflow.name}"? Esta accion no se puede deshacer.`
              : ""
          }
          confirmLabel="Eliminar"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            if (!workflow) return;
            deleteWorkflow(workflow.id);
            setShowDeleteModal(false);
            router.push("/workflows");
          }}
        />
      </section>
    </Layout>
  );
}
