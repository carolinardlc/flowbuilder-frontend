import test from "node:test";
import assert from "node:assert/strict";
import { validateNoCycles } from "../validateNoCycles";
import { createConnection, createNode } from "./fixtures";

test("validateNoCycles no devuelve errores si el grafo es aciclico", () => {
  const nodes = [
    createNode({ id: "start", type: "START", title: "Inicio" }),
    createNode({ id: "cmd", type: "COMMAND", title: "Comando" }),
  ];
  const connections = [createConnection("start", "cmd")];

  const errors = validateNoCycles(nodes, connections);
  assert.equal(errors.length, 0);
});

test("validateNoCycles detecta ciclos", () => {
  const nodes = [
    createNode({ id: "start", type: "START", title: "Inicio" }),
    createNode({ id: "cmd", type: "COMMAND", title: "Comando" }),
  ];
  const connections = [
    createConnection("start", "cmd"),
    createConnection("cmd", "start"),
  ];

  const errors = validateNoCycles(nodes, connections);
  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.code, "CYCLE_DETECTED");
});
