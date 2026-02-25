import { useState } from "react";
import type { Connection, WorkflowNodeData } from "../types";
import {
  toExportWorkflow,
  type Workflow as WorkflowSerializationModel,
} from "../domain/serialization";
import { validateWorkflow } from "../domain/validation";
import { postWorkflow } from "../services/workflowApi";
import { downloadWorkflowJson } from "../services/workflowFile";
import { addWorkflowExecutionToStorage } from "../../../../services/workflowExecutionsStorage";

type ValidationDialogState = {
  status: "idle" | "ok" | "error";
  messages: string[];
};

type SendDialogState = {
  status: "idle" | "ok" | "error";
  message: string;
};

type Params = {
  workflowId: string;
  workflowName: string | null;
  nodes: WorkflowNodeData[];
  connections: Connection[];
};

const getBackendEndpoint = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("backend-config");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<{ url: string; port: string }>;
    const url = typeof parsed.url === "string" ? parsed.url.trim() : "";
    const port = typeof parsed.port === "string" ? parsed.port.trim() : "";
    return url && port ? `http://${url}:${port}/api/workflows/run` : undefined;
  } catch {
    return undefined;
  }
};

const buildWorkflowModel = ({
  workflowId,
  workflowName,
  nodes,
  connections,
}: Params): WorkflowSerializationModel => ({
  id: workflowId,
  name: workflowName ?? `Workflow ${workflowId}`,
  nodes,
  connections,
});

export const useWorkflowExecution = (params: Params) => {
  const [validationResult, setValidationResult] =
    useState<ValidationDialogState>({ status: "idle", messages: [] });
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionKey, setExecutionKey] = useState(0);
  const [sendResult, setSendResult] = useState<SendDialogState>({
    status: "idle",
    message: "",
  });
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [backendTerminalOutput, setBackendTerminalOutput] = useState("");

  const getValidationErrors = () =>
    validateWorkflow({ nodes: params.nodes, connections: params.connections }).map(
      (e) => e.message,
    );

  const runWorkflowValidation = () => {
    const errors = getValidationErrors();
    setValidationResult(
      errors.length === 0
        ? { status: "ok", messages: ["Workflow válido. No se encontraron errores."] }
        : { status: "error", messages: errors },
    );
    setIsValidationOpen(true);
  };

  const handleDownloadJson = () => {
    const model = buildWorkflowModel(params);
    downloadWorkflowJson(toExportWorkflow(model), model.name);
  };

  const handleSendToBackend = async () => {
    const model = buildWorkflowModel(params);
    const payload = toExportWorkflow(model);
    const endpoint = getBackendEndpoint();
    try {
      const result = await postWorkflow(payload, endpoint);
      if (!result.ok) {
        setBackendTerminalOutput(result.bodyText || `Backend error: ${result.status}`);
        throw new Error(`Backend error: ${result.status}`);
      }
      setBackendTerminalOutput(result.bodyText || "(sin contenido)");
      addWorkflowExecutionToStorage({
        id: `exec-${Date.now()}`,
        workflowId: params.workflowId,
        executedAt: new Date().toISOString(),
        status: "SUCCESS",
        message: result.bodyText || "Workflow enviado correctamente.",
      });
      setSendResult({ status: "ok", message: "Workflow enviado correctamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido.";
      setBackendTerminalOutput(message);
      addWorkflowExecutionToStorage({
        id: `exec-${Date.now()}`,
        workflowId: params.workflowId,
        executedAt: new Date().toISOString(),
        status: "ERROR",
        message,
      });
      setSendResult({ status: "error", message });
    } finally {
      setIsSendOpen(true);
    }
  };

  const handleExecuteWorkflow = () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      setValidationResult({ status: "error", messages: errors });
      setIsValidationOpen(true);
      return;
    }
    setIsExecuting(false);
    setExecutionKey((prev) => prev + 1);
    requestAnimationFrame(() => {
      setIsExecuting(true);
      window.setTimeout(() => setIsExecuting(false), 2200);
    });
    void handleSendToBackend();
  };

  return {
    validationResult,
    isValidationOpen,
    setIsValidationOpen,
    sendResult,
    isSendOpen,
    setIsSendOpen,
    backendTerminalOutput,
    isExecuting,
    executionKey,
    runWorkflowValidation,
    handleDownloadJson,
    handleExecuteWorkflow,
  };
};
