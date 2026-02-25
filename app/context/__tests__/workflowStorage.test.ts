import test from "node:test";
import assert from "node:assert/strict";
import { removeWorkflowCanvasFromStorage } from "../workflowStorage";
import {
  saveWorkflowCanvasSnapshot,
  loadWorkflowCanvasSnapshot,
} from "../../services/workflowCanvasStorage";
import {
  addWorkflowExecutionToStorage,
  loadWorkflowExecutionsFromStorage,
} from "../../services/workflowExecutionsStorage";

test("limpia snapshot y ejecuciones del workflow", () => {
  const mem = new Map<string, string>();

  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => mem.set(k, v),
      removeItem: (k: string) => mem.delete(k),
    },
    configurable: true,
    writable: true,
  });

  saveWorkflowCanvasSnapshot("wf-1", {
    nodes: [{ id: "n1", title: "Inicio", type: "START", x: 0, y: 0 }],
    connections: [],
  });

  addWorkflowExecutionToStorage({
    id: "e1",
    workflowId: "wf-1",
    executedAt: "x",
    status: "SUCCESS",
    message: "ok",
  });

  addWorkflowExecutionToStorage({
    id: "e2",
    workflowId: "wf-2",
    executedAt: "x",
    status: "SUCCESS",
    message: "ok",
  });

  removeWorkflowCanvasFromStorage("wf-1");

  assert.equal(loadWorkflowCanvasSnapshot("wf-1"), null);
  assert.equal(
    loadWorkflowExecutionsFromStorage().some((e) => e.workflowId === "wf-1"),
    false,
  );
});
