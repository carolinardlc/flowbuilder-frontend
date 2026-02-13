import test from "node:test";
import assert from "node:assert/strict";
import { validateNodeConfig } from "../validateNodeConfig";
import { createNode } from "./fixtures";

test("validateNodeConfig valida COMMAND", () => {
  const invalid = createNode({ id: "c1", type: "COMMAND", title: "Command 1" });
  const valid = createNode({
    id: "c2",
    type: "COMMAND",
    config: { command: "ADD" },
  });

  assert.equal(validateNodeConfig(invalid).length, 1);
  assert.equal(validateNodeConfig(valid).length, 0);
});

test("validateNodeConfig valida HTTP_REQUEST", () => {
  const invalid = createNode({
    id: "h1",
    type: "HTTP_REQUEST",
    title: "HTTP 1",
    config: { method: "GET" },
  });
  const valid = createNode({
    id: "h2",
    type: "HTTP_REQUEST",
    config: { method: "POST", url: "https://api.example.com" },
  });

  assert.equal(validateNodeConfig(invalid).length, 1);
  assert.equal(validateNodeConfig(valid).length, 0);
});

test("validateNodeConfig valida CONDITIONAL", () => {
  const invalid = createNode({ id: "if1", type: "CONDITIONAL" });
  const valid = createNode({
    id: "if2",
    type: "CONDITIONAL",
    config: { sourceNodeId: "node-1" },
  });

  assert.equal(validateNodeConfig(invalid).length, 1);
  assert.equal(validateNodeConfig(valid).length, 0);
});
