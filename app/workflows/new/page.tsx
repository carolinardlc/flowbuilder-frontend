"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { useWorkflows } from "../../context/WorkflowsContext";
import { formatDateEs } from "../../utils/formatDate";
import WorkflowForm, {
  type WorkflowFormTouched,
  type WorkflowFormValues,
} from "../_components/WorkflowForm";

export default function NewWorkflowPage() {
  const router = useRouter();
  const { addWorkflow } = useWorkflows();
  const [form, setForm] = useState<WorkflowFormValues>({
    name: "",
    description: "",
  });
  const [touched, setTouched] = useState<WorkflowFormTouched>({
    name: false,
    description: false,
  });

  const isNameValid = form.name.trim().length > 0;
  const isDescriptionValid = form.description.trim().length > 0;
  const isFormValid = isNameValid && isDescriptionValid;

  const formattedDate = useMemo(() => {
    return formatDateEs();
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
            Define el nombre y la descripcion de tu flujo.
          </p>
        </div>

        <WorkflowForm
          form={form}
          touched={touched}
          isNameValid={isNameValid}
          isDescriptionValid={isDescriptionValid}
          isFormValid={isFormValid}
          submitLabel="Crear workflow"
          onSubmit={handleSubmit}
          onFieldChange={(field, value) =>
            setForm((prev) => ({ ...prev, [field]: value }))
          }
          onFieldBlur={(field) =>
            setTouched((prev) => ({ ...prev, [field]: true }))
          }
        />
      </section>
    </Layout>
  );
}
