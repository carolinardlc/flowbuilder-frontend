"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadWorkflowsFromStorage,
  removeWorkflowCanvasFromStorage,
  saveWorkflowsToStorage,
} from "./workflowStorage";

type WorkflowStatus = "ACTIVE" | "IN_PROGRESS" | "DONE";

export type Workflow = {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  date: string;
};

type WorkflowsContextValue = {
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  upsertWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
};

const WorkflowsContext = createContext<WorkflowsContextValue | undefined>(
  undefined
);

const initialWorkflows: Workflow[] = [
  {
    id: "1",
    name: "Onboarding suave",
    description: "Checklist inicial, accesos y guias rapidas para nuevos equipos.",
    date: "12 Mar 2025",
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Revision creativa",
    description: "Rondas de feedback visual para campañas retro.",
    date: "28 Feb 2025",
    status: "IN_PROGRESS",
  },
  {
    id: "3",
    name: "Entrega de proyectos",
    description: "Pasos finales, aprobaciones y archivos listos.",
    date: "05 Ene 2025",
    status: "DONE",
  },
  {
    id: "4",
    name: "Sprint de producto",
    description: "Backlog, sesiones diarias y demo semanal.",
    date: "18 Dic 2024",
    status: "ACTIVE",
  },
];

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadWorkflowsFromStorage();
    if (loaded) {
      setWorkflows(loaded);
    }
    setIsStorageHydrated(true);
  }, []);

  useEffect(() => {
    if (!isStorageHydrated) return;
    saveWorkflowsToStorage(workflows);
  }, [workflows, isStorageHydrated]);

  const value = useMemo(
    () => ({
      workflows,
      addWorkflow: (workflow: Workflow) =>
        setWorkflows((prev) => [workflow, ...prev]),
      upsertWorkflow: (workflow: Workflow) =>
        setWorkflows((prev) => {
          const exists = prev.some((item) => item.id === workflow.id);
          if (exists) {
            return prev.map((item) => (item.id === workflow.id ? workflow : item));
          }
          return [workflow, ...prev];
        }),
      updateWorkflow: (workflow: Workflow) =>
        setWorkflows((prev) =>
          prev.map((item) => (item.id === workflow.id ? workflow : item))
        ),
      deleteWorkflow: (id: string) =>
        setWorkflows((prev) => {
          removeWorkflowCanvasFromStorage(id);
          return prev.filter((item) => item.id !== id);
        }),
    }),
    [workflows]
  );

  return (
    <WorkflowsContext.Provider value={value}>
      {children}
    </WorkflowsContext.Provider>
  );
}

export function useWorkflows() {
  const context = useContext(WorkflowsContext);
  if (!context) {
    throw new Error("useWorkflows must be used within WorkflowsProvider");
  }
  return context;
}
