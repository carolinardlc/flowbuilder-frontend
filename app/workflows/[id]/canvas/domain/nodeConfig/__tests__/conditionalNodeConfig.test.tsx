import test from "node:test";
import assert from "node:assert/strict";
import { isValidElement } from "react";
import conditionalNodeConfig from "../conditionalNodeConfig";
import { baseConfig } from "./fixtures";

test("conditionalNodeConfig valida sourceNodeId", () => {
  const errors = conditionalNodeConfig.validateConfig({ sourceNodeId: "" });
  assert.equal(errors.length, 1);
});

test("conditionalNodeConfig normaliza defaults", () => {
  const normalized = conditionalNodeConfig.normalizeConfig({});
  assert.equal(normalized.sourceNodeId, "");
  assert.equal(normalized.conditionExpression, "");
});

test("conditionalNodeConfig renderiza formulario", () => {
  const element = conditionalNodeConfig.renderConfigForm({
    config: baseConfig("CONDITIONAL"),
    updateNestedConfig: () => undefined,
    incomingNodeOptions: [{ id: "n1", name: "A", type: "COMMAND" }],
  });
  assert.equal(isValidElement(element), true);
});
