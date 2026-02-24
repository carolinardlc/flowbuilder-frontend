"use client";

export type WorkflowExecutionStatus = "SUCCESS" | "ERROR";

export type WorkflowExecutionRecord = {
  id: string;
  workflowId: string;
  executedAt: string;
  status: WorkflowExecutionStatus;
  message: string;
};

const WORKFLOW_EXECUTIONS_STORAGE_KEY = "workflows:executions";

const isExecutionRecord = (value: unknown): value is WorkflowExecutionRecord => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<WorkflowExecutionRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.workflowId === "string" &&
    typeof record.executedAt === "string" &&
    (record.status === "SUCCESS" || record.status === "ERROR") &&
    typeof record.message === "string"
  );
};

export const loadWorkflowExecutionsFromStorage = (): WorkflowExecutionRecord[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(WORKFLOW_EXECUTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isExecutionRecord);
  } catch (error) {
    console.error("Error loading workflow executions from localStorage:", error);
    return [];
  }
};

export const saveWorkflowExecutionsToStorage = (
  executions: WorkflowExecutionRecord[],
) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      WORKFLOW_EXECUTIONS_STORAGE_KEY,
      JSON.stringify(executions),
    );
  } catch (error) {
    console.error("Error saving workflow executions to localStorage:", error);
  }
};

export const addWorkflowExecutionToStorage = (
  execution: WorkflowExecutionRecord,
) => {
  const current = loadWorkflowExecutionsFromStorage();
  saveWorkflowExecutionsToStorage([execution, ...current]);
};

export const removeWorkflowExecutionsFromStorage = (workflowId: string) => {
  const current = loadWorkflowExecutionsFromStorage();
  const next = current.filter((item) => item.workflowId !== workflowId);
  saveWorkflowExecutionsToStorage(next);
};

