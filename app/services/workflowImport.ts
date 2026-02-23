"use client";

import type { Workflow } from "../context/WorkflowsContext";
import { formatDateEs } from "../utils/formatDate";
import { STORAGE_KEYS } from "../workflows/[id]/canvas/constants/storage";
import {
  convertWorkflowToCanvasSnapshot,
  parseWorkflowImportData,
} from "../workflows/[id]/canvas/utils/importWorkflow";
import { validateWorkflowImport } from "../workflows/[id]/canvas/utils/validateImport";

type CanvasSnapshot = ReturnType<typeof convertWorkflowToCanvasSnapshot>;

export type WorkflowImportProcessResult =
  | { ok: false; error: string }
  | {
      ok: true;
      workflowId: string;
      route: string;
      snapshot: CanvasSnapshot;
      workflowRecord: Workflow;
      warning?: string;
    };

const parseJsonSafely = (
  rawJson: string,
): { ok: true; data: unknown } | { ok: false; error: string } => {
  try {
    return { ok: true, data: JSON.parse(rawJson.replace(/^\uFEFF/, "")) };
  } catch {
    return {
      ok: false,
      error: "El archivo esta corrupto o no es un JSON valido.",
    };
  }
};

export const processWorkflowImport = (
  rawJson: string,
): WorkflowImportProcessResult => {
  const parsedJson = parseJsonSafely(rawJson);
  if (!parsedJson.ok) {
    return parsedJson;
  }

  const validation = validateWorkflowImport(parsedJson.data);
  if (!validation.isValid) {
    return {
      ok: false,
      error: validation.error || "Estructura del workflow invalida.",
    };
  }

  const parsedWorkflow = parseWorkflowImportData(parsedJson.data);
  if (!parsedWorkflow.ok) {
    return {
      ok: false,
      error: parsedWorkflow.error || "Error al importar el workflow.",
    };
  }

  const snapshot = convertWorkflowToCanvasSnapshot(parsedWorkflow.workflow);

  return {
    ok: true,
    workflowId: parsedWorkflow.workflow.id,
    route: `/workflows/${parsedWorkflow.workflow.id}`,
    snapshot,
    workflowRecord: {
      id: parsedWorkflow.workflow.id,
      name: parsedWorkflow.workflow.name,
      description: `Importado desde JSON (${snapshot.nodes.length} nodos)`,
      status: "ACTIVE",
      date: formatDateEs(),
    },
    warning: parsedWorkflow.warning,
  };
};

export const persistImportedWorkflowSnapshot = (
  workflowId: string,
  snapshot: CanvasSnapshot,
) => {
  const storageKey = STORAGE_KEYS.WORKFLOW_CANVAS(workflowId);
  if (!storageKey) return;

  localStorage.removeItem(storageKey);
  localStorage.setItem(storageKey, JSON.stringify(snapshot));
};
