import type { ExportWorkflowJson } from "../domain/serialization";

const sanitizeFileName = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
  return normalized || "workflow";
};

export const toWorkflowJsonString = (data: ExportWorkflowJson): string => {
  return JSON.stringify(data, null, 2);
};

export function downloadWorkflowJson(
  data: ExportWorkflowJson,
  fileName: string,
): void {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("Download API no disponible en este entorno.");
  }

  const json = toWorkflowJsonString(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(fileName)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

