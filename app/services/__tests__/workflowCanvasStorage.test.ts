import test from "node:test";
import assert from "node:assert/strict";
import {
  saveWorkflowCanvasSnapshot,
  loadWorkflowCanvasSnapshot,
  removeWorkflowCanvasSnapshot,
} from "../workflowCanvasStorage";

test("guarda/carga/borra snapshot", () => {
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

  assert.equal(loadWorkflowCanvasSnapshot("wf-1")?.nodes.length, 1);

  removeWorkflowCanvasSnapshot("wf-1");
  assert.equal(loadWorkflowCanvasSnapshot("wf-1"), null);
});
