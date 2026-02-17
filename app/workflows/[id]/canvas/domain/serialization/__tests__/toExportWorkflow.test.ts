import test from "node:test";
import assert from "node:assert/strict";
import { toExportWorkflow } from "../toExportWorkflow";
import { createConnection, createNode, createWorkflow } from "./fixtures";

test("toExportWorkflow serializa payload exportable", () => {
  const workflow = createWorkflow(
    [
      createNode({ id: "n1", type: "START", title: "Inicio" }),
      createNode({
        id: "n2",
        type: "HTTP_REQUEST",
        title: "HTTP",
        config: {
          method: "GET",
          url: "https://api.example.com",
          timeoutMs: "3000",
          retries: "2",
          errorPolicy: "CONTINUE",
        },
      }),
      createNode({
        id: "n3",
        type: "CONDITIONAL",
        title: "Condicional",
        config: { sourceNodeId: "n2" },
      }),
    ],
    [createConnection("n1", "n2"), createConnection("n2", "n3")],
  );

  const result = toExportWorkflow(workflow);
  assert.equal(result.nodes.length, 3);
  const httpNode = result.nodes.find((node) => node.id === "n2");
  assert.equal(httpNode?.type, "HTTP");
  assert.equal(result.connections.length, 2);
});

test("toExportWorkflow soporta workflow sin START", () => {
  const workflow = createWorkflow(
    [createNode({ id: "n2", type: "COMMAND", title: "Command" })],
    [],
  );

  const result = toExportWorkflow(workflow);
  assert.equal(result.nodes.length, 1);
  assert.equal(result.nodes[0]?.type, "COMMAND");
});
