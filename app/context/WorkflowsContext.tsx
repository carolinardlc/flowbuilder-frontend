// WorkflowsContext.tsx
"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { Node, Edge } from "@xyflow/react";


export type WorkflowStatus = "DRAFT" | "VALID" | "INVALID";

export type Workflow = {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: Node[];
  edges: Edge[];
};

type WorkflowsContextValue = {
  workflows: Workflow[];

  addWorkflow: (input: { name: string; description: string }) => Workflow;
  updateWorkflowMeta: (
    id: string,
    patch: Partial<Pick<Workflow, "name" | "description" | "status">>
  ) => void;
  updateWorkflowGraph: (id: string, nodes: Node[], edges: Edge[]) => void;

  deleteWorkflow: (id: string) => void;
};

const WorkflowsContext = createContext<WorkflowsContextValue | undefined>(
  undefined
);

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}


function makeStartNode(workflowId: string): Node {
  return {
    id: `start-${workflowId}`,
    type: "start", // ✅ ahora sí usa tu StartNode (nodeTypes.start)
    position: { x: 120, y: 120 },
    data: {
      title: "START", // ✅ tu StartNode lee data.title
      // opcional: puedes guardar el workflowId en data si te sirve
      workflowId,
      config: {},
    },
  };
}

/** ✅ Arranca VACÍO */
const initialWorkflows: Workflow[] = [];

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);

  const value = useMemo<WorkflowsContextValue>(
    () => ({
      workflows,

      addWorkflow: ({ name, description }) => {
        const id = makeId();
        const wf: Workflow = {
          id,
          name,
          description,
          status: "DRAFT",
          nodes: [makeStartNode(id)],
          edges: [],
        };
        setWorkflows((prev) => [wf, ...prev]);
        return wf;
      },

      updateWorkflowMeta: (id, patch) => {
        setWorkflows((prev) =>
          prev.map((w) => {
            if (w.id !== id) return w;

            // si cambias meta, lo volvemos DRAFT (simple y seguro)
            const touchedMeta = Boolean(patch.name || patch.description);
            return {
              ...w,
              ...patch,
              status: patch.status ?? (touchedMeta ? "DRAFT" : w.status),
            };
          })
        );
      },

      updateWorkflowGraph: (id, nodes, edges) => {
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  nodes,
                  edges,
                  status: "DRAFT",
                }
              : w
          )
        );
      },

      deleteWorkflow: (id) => {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      },
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
