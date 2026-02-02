"use client";

// This panel summarizes validation issues and offers shortcuts to focus nodes.
// It mirrors the reference UX while using destination visual tokens.

import type { ValidationReport, ValidationSeverity } from "./types";

type ValidationPanelProps = {
  report: ValidationReport;
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
};

const severityLabels: Record<ValidationSeverity, string> = {
  error: "Error",
  warning: "Advertencia",
  info: "Información",
};

export default function ValidationPanel({
  report,
  onClose,
  onFocusNode,
}: ValidationPanelProps) {
  const errorCount = report.issues.filter((issue) => issue.severity === "error")
    .length;
  const warningCount = report.issues.filter(
    (issue) => issue.severity === "warning"
  ).length;
  const infoCount = report.issues.filter((issue) => issue.severity === "info")
    .length;

  return (
    <div className="rf-validation-panel" role="region" aria-label="Validación">
      <div className="rf-validation-header">
        <div>
          <p className="panel-title">Reporte de validación</p>
          <p className="rf-validation-subtitle">
            {report.isValid
              ? "El workflow es válido."
              : "Corrige los errores antes de ejecutar."}
          </p>
        </div>
        <div className="rf-validation-counts">
          {errorCount > 0 ? (
            <span className="rf-validation-pill rf-validation-pill--error">
              {errorCount} error(es)
            </span>
          ) : null}
          {warningCount > 0 ? (
            <span className="rf-validation-pill rf-validation-pill--warning">
              {warningCount} warning(s)
            </span>
          ) : null}
          {infoCount > 0 ? (
            <span className="rf-validation-pill rf-validation-pill--info">
              {infoCount} info
            </span>
          ) : null}
          <button
            className="btn-secondary rf-validation-close"
            type="button"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      <div className="rf-validation-body">
        {report.issues.length === 0 ? (
          <p className="rf-validation-empty">No se encontraron problemas.</p>
        ) : (
          report.issues.map((issue, index) => (
            <div key={`${issue.nodeId ?? "global"}-${index}`} className="rf-issue">
              <div className="rf-issue-header">
                <span
                  className={`rf-issue-badge rf-issue-badge--${issue.severity}`}
                >
                  {severityLabels[issue.severity]}
                </span>
                {issue.nodeId ? (
                  <span className="rf-issue-node">Nodo: {issue.nodeId}</span>
                ) : null}
              </div>
              <p className="rf-issue-message">{issue.message}</p>
              {issue.action === "focus" && issue.nodeId ? (
                <button
                  className="rf-issue-focus"
                  type="button"
                  onClick={() => onFocusNode(issue.nodeId!)}
                >
                  Ir al nodo
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
