import test from "node:test";
import assert from "node:assert/strict";
import {
  addWorkflowExecutionToStorage,
  loadWorkflowExecutionsFromStorage,
  removeWorkflowExecutionsFromStorage,
} from "../workflowExecutionsStorage";

test("borra solo ejecuciones del workflow indicado", () => {
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
    status: "ERROR",
    message: "fail",
  });

  removeWorkflowExecutionsFromStorage("wf-1");

  const list = loadWorkflowExecutionsFromStorage();
  assert.equal(list.length, 1);
  assert.equal(list[0]?.workflowId, "wf-2");
});
