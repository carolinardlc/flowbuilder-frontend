import test from "node:test";
import assert from "node:assert/strict";
import { isValidElement } from "react";
import httpNodeConfig from "../httpNodeConfig";
import { baseConfig } from "./fixtures";

test("httpNodeConfig valida url y metodo", () => {
  const errors = httpNodeConfig.validateConfig({ method: "GET", url: "" });
  assert.equal(errors.length > 0, true);
});

test("httpNodeConfig normaliza defaults", () => {
  const normalized = httpNodeConfig.normalizeConfig({});
  assert.equal(normalized.method, "GET");
  assert.equal(normalized.url, "");
  assert.equal(normalized.errorPolicy, "STOP");
});

test("httpNodeConfig renderiza formulario", () => {
  const element = httpNodeConfig.renderConfigForm({
    config: baseConfig("HTTP_REQUEST"),
    updateNestedConfig: () => undefined,
  });
  assert.equal(isValidElement(element), true);
});
