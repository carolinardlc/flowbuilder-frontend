import test from "node:test";
import assert from "node:assert/strict";
import { processWorkflowImport } from "../workflowImport";

test("importa workflow valido", () => {
  const json = JSON.stringify({
    id: "wf-1",
    name: "Demo",
    nodes: [
      { id: "n1", name: "Inicio", type: "START" },
      { id: "n2", name: "Cmd", type: "COMMAND", command: "ADD" },
    ],
    connections: [{ fromNodeId: "n1", toNodeId: "n2", condition: true }],
  });

  const result = processWorkflowImport(json);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.workflowId, "wf-1");
    assert.equal(result.snapshot.nodes.length, 2);
  }
});

test("falla con JSON invalido", () => {
  const result = processWorkflowImport("{ roto");
  assert.equal(result.ok, false);
});
