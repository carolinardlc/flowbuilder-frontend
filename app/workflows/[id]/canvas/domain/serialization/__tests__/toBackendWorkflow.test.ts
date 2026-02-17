import test from "node:test";
import assert from "node:assert/strict";
import { toBackendWorkflow } from "../toBackendWorkflow";
import { createConnection, createNode, createWorkflow } from "./fixtures";

test("toBackendWorkflow serializa nodos y conexiones validas", () => {
  const workflow = createWorkflow(
    [
      createNode({ id: "n1", type: "START", title: "Inicio" }),
      createNode({
        id: "n2",
        type: "COMMAND",
        title: "Command",
        config: { command: "ADD", args: "5", output: "result" },
      }),
      createNode({
        id: "n3",
        type: "HTTP_REQUEST",
        title: "HTTP",
        config: { url: "https://api.example.com" },
      }),
    ],
    [createConnection("n1", "n2"), createConnection("n2", "n3")],
  );

  const result = toBackendWorkflow(workflow);
  assert.equal(result.nodes.length, 3);
  assert.equal(result.nodes[1]?.type, "COMMAND");
  assert.equal(result.nodes[1]?.commandType, "ADD");
  assert.equal(result.nodes[2]?.type, "HTTP");
  assert.equal(result.connections.length, 2);
});

test("toBackendWorkflow omite conexiones con nodos inexistentes", () => {
  const workflow = createWorkflow(
    [
      createNode({ id: "n1", type: "START" }),
      createNode({ id: "n2", type: "COMMAND" }),
    ],
    [createConnection("n1", "n2"), createConnection("n1", "ghost")],
  );

  const result = toBackendWorkflow(workflow);
  assert.equal(result.connections.length, 1);
  assert.equal(result.connections[0]?.toNodeId, "n2");
});
