import test from "node:test";
import assert from "node:assert/strict";
import { validateStartNode } from "../validateStartNode";
import { createNode } from "./fixtures";

test("validateStartNode requiere un nodo START", () => {
  const nodes = [createNode({ id: "n1", type: "COMMAND" })];
  const errors = validateStartNode(nodes);

  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.code, "START_MISSING");
});

test("validateStartNode permite un solo START", () => {
  const nodes = [
    createNode({ id: "n1", type: "START" }),
    createNode({ id: "n2", type: "COMMAND" }),
  ];
  const errors = validateStartNode(nodes);

  assert.equal(errors.length, 0);
});

test("validateStartNode rechaza multiples START", () => {
  const nodes = [
    createNode({ id: "n1", type: "START" }),
    createNode({ id: "n2", type: "START" }),
  ];
  const errors = validateStartNode(nodes);

  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.code, "START_MULTIPLE");
});
