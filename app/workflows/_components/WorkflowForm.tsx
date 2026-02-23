"use client";

import Link from "next/link";

export type WorkflowFormValues = {
  name: string;
  description: string;
};

export type WorkflowFormTouched = {
  name: boolean;
  description: boolean;
};

type WorkflowFormProps = {
  form: WorkflowFormValues;
  touched: WorkflowFormTouched;
  isNameValid: boolean;
  isDescriptionValid: boolean;
  isFormValid: boolean;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof WorkflowFormValues, value: string) => void;
  onFieldBlur: (field: keyof WorkflowFormTouched) => void;
  onDelete?: () => void;
  cancelHref?: string;
};

export default function WorkflowForm({
  form,
  touched,
  isNameValid,
  isDescriptionValid,
  isFormValid,
  submitLabel,
  onSubmit,
  onFieldChange,
  onFieldBlur,
  onDelete,
  cancelHref = "/workflows",
}: WorkflowFormProps) {
  return (
    <form className="app-card form-card" onSubmit={onSubmit}>
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
          onChange={(event) => onFieldChange("name", event.target.value)}
          onBlur={() => onFieldBlur("name")}
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
          onChange={(event) => onFieldChange("description", event.target.value)}
          onBlur={() => onFieldBlur("description")}
        />
        {!isDescriptionValid && touched.description ? (
          <p className="form-error">La descripción es obligatoria.</p>
        ) : null}
      </div>

      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={!isFormValid}>
          {submitLabel}
        </button>
        <Link href={cancelHref} className="btn-secondary link-button">
          Cancelar
        </Link>
        {onDelete ? (
          <button
            type="button"
            className="btn-secondary btn-danger"
            onClick={onDelete}
          >
            Eliminar
          </button>
        ) : null}
      </div>
    </form>
  );
}
