import type { BackendWorkflowPayload } from "../domain/serialization";
import type { Connection, WorkflowNodeData } from "../types";

export const DEFAULT_WORKFLOW_RUN_ENDPOINT =
  process.env.NEXT_PUBLIC_WORKFLOW_RUN_URL ??
  "http://192.168.5.2:8080/api/workflows/run";

export type WorkflowApiResult = {
  ok: boolean;
  status: number;
  bodyText: string;
};

export type CanvasSnapshotPayload = {
  nodes: WorkflowNodeData[];
  connections: Connection[];
};

const parseResponseBody = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    }
    return await response.text();
  } catch {
    return "";
  }
};

// Servicio de red aislado para POST de workflows.
export async function postWorkflow(
  payload: BackendWorkflowPayload,
  endpoint: string = DEFAULT_WORKFLOW_RUN_ENDPOINT,
): Promise<WorkflowApiResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const bodyText = await parseResponseBody(response);
  return {
    ok: response.ok,
    status: response.status,
    bodyText,
  };
}

// Servicio para sincronizar snapshot del canvas en backend (si hay API base configurada).
export async function syncWorkflowCanvasSnapshot(
  workflowId: string,
  payload: CanvasSnapshotPayload,
  apiBaseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
): Promise<void> {
  const normalizedBase = apiBaseUrl.replace(/\/$/, "");
  if (!normalizedBase) return;

  const url = `${normalizedBase}/api/workflows/${workflowId}/canvas`;
  await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
