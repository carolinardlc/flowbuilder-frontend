"use client";

// This form edits the error handling policy for a node.
// It also surfaces a short recommendation to guide the user.

import type { ErrorPolicy } from "../types";

type ErrorPolicyConfigProps = {
  policy: ErrorPolicy;
  onChange: (policy: ErrorPolicy) => void;
};

export default function ErrorPolicyConfig({
  policy,
  onChange,
}: ErrorPolicyConfigProps) {
  // Provide a short recommendation to mirror the reference UX.
  const recommendation =
    policy === "STOP_ON_FAIL"
      ? "Recomendado para flujos críticos donde los errores deben detener la ejecución."
      : "Útil si deseas continuar el flujo aunque un nodo falle.";

  return (
    <div className="rf-inspector-section">
      <label className="form-label" htmlFor="error-policy">
        Política de error
      </label>
      <select
        id="error-policy"
        className="form-input rf-select"
        value={policy}
        onChange={(event) => onChange(event.target.value as ErrorPolicy)}
      >
        <option value="STOP_ON_FAIL">STOP_ON_FAIL</option>
        <option value="CONTINUE_ON_FAIL">CONTINUE_ON_FAIL</option>
      </select>
      <p className="rf-inspector-note">{recommendation}</p>
    </div>
  );
}
