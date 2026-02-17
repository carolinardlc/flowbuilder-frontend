import test from "node:test";
import assert from "node:assert/strict";
import { isValidElement } from "react";
import commandNodeConfig from "../commandNodeConfig";
import { baseConfig } from "./fixtures";

test("commandNodeConfig valida comando requerido", () => {
  const invalid = commandNodeConfig.validateConfig({ command: "" });
  const valid = commandNodeConfig.validateConfig({ command: "ADD" });

  assert.equal(invalid.length, 1);
  assert.equal(valid.length, 0);
});

test("commandNodeConfig normaliza valor por defecto", () => {
  const normalized = commandNodeConfig.normalizeConfig({});
  assert.equal(normalized.command, "");
});

test("commandNodeConfig renderiza formulario", () => {
  const element = commandNodeConfig.renderConfigForm({
    config: baseConfig("COMMAND"),
    updateNestedConfig: () => undefined,
  });
  assert.equal(isValidElement(element), true);
});
