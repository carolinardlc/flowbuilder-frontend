"use client";

import type { Workflow } from "./WorkflowsContext";
import { removeWorkflowCanvasSnapshot } from "../services/workflowCanvasStorage";
import { removeWorkflowExecutionsFromStorage } from "../services/workflowExecutionsStorage";

const WORKFLOWS_STORAGE_KEY = "workflows:list";

const isWorkflow = (value: unknown): value is Workflow => {
  if (!value || typeof value !== "object") return false;
  const workflow = value as Partial<Workflow>;
  return (
    typeof workflow.id === "string" &&
    typeof workflow.name === "string" &&
    typeof workflow.description === "string" &&
    typeof workflow.date === "string" &&
    (workflow.status === "ACTIVE" ||
      workflow.status === "IN_PROGRESS" ||
      workflow.status === "DONE")
  );
};

export const loadWorkflowsFromStorage = (): Workflow[] | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    return parsed.filter(isWorkflow);
  } catch (error) {
    console.error("Error loading workflows from localStorage:", error);
    return null;
  }
};

export const saveWorkflowsToStorage = (workflows: Workflow[]) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
  } catch (error) {
    console.error("Error saving workflows to localStorage:", error);
  }
};

export const removeWorkflowCanvasFromStorage = (workflowId: string) => {
  removeWorkflowCanvasSnapshot(workflowId);
  removeWorkflowExecutionsFromStorage(workflowId);
};
