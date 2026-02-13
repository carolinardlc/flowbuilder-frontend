import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkflow } from "../validateWorkflow";
import { createConnection, createNode } from "./fixtures";

test("validateWorkflow combina validaciones estructurales y de configuracion", () => {
  const nodes = [
    createNode({ id: "start", type: "START", title: "Inicio" }),
    createNode({ id: "cmd", type: "COMMAND", title: "Comando" }),
    createNode({ id: "if", type: "CONDITIONAL", title: "Condicional" }),
  ];
  const connections = [
    createConnection("start", "cmd"),
    createConnection("cmd", "if"),
    createConnection("if", "cmd"),
  ];

  const errors = validateWorkflow({ nodes, connections });
  const codes = errors.map((error) => error.code);

  assert.equal(codes.includes("CYCLE_DETECTED"), true);
  assert.equal(codes.includes("NODE_CONFIG_INVALID"), true);
});

test("validateWorkflow devuelve arreglo vacio en workflow valido", () => {
  const nodes = [
    createNode({ id: "start", type: "START", title: "Inicio" }),
    createNode({
      id: "cmd",
      type: "COMMAND",
      title: "Comando",
      config: { command: "ADD" },
    }),
    createNode({
      id: "http",
      type: "HTTP_REQUEST",
      title: "HTTP",
      config: { method: "GET", url: "https://api.example.com" },
    }),
    createNode({
      id: "if",
      type: "CONDITIONAL",
      title: "Condicional",
      config: { sourceNodeId: "cmd" },
    }),
  ];
  const connections = [
    createConnection("start", "cmd"),
    createConnection("cmd", "http"),
    createConnection("http", "if"),
  ];

  const errors = validateWorkflow({ nodes, connections });
  assert.equal(errors.length, 0);
});
