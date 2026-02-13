import test from "node:test";
import assert from "node:assert/strict";
import { validateReachability } from "../validateReachability";
import { createConnection, createNode } from "./fixtures";

test("validateReachability ignora el check si no hay START", () => {
  const nodes = [createNode({ id: "cmd", type: "COMMAND" })];
  const errors = validateReachability(nodes, []);

  assert.equal(errors.length, 0);
});

test("validateReachability detecta nodos inalcanzables", () => {
  const nodes = [
    createNode({ id: "start", type: "START", title: "Inicio" }),
    createNode({ id: "cmd", type: "COMMAND", title: "Comando" }),
    createNode({ id: "http", type: "HTTP_REQUEST", title: "HTTP" }),
  ];
  const connections = [createConnection("start", "cmd")];

  const errors = validateReachability(nodes, connections);
  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.code, "UNREACHABLE_NODE");
});
