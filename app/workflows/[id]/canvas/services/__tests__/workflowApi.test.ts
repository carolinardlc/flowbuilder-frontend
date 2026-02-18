import test from "node:test";
import assert from "node:assert/strict";
import { postWorkflow, syncWorkflowCanvasSnapshot } from "../workflowApi";
import type { ExportWorkflowJson } from "../../domain/serialization";

const payload: ExportWorkflowJson = {
  id: "wf-1",
  name: "Workflow API Test",
  nodes: [],
  connections: [],
};

test("postWorkflow envia payload y retorna respuesta exitosa", async () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), "http://localhost:8080/api/workflows/run");
    assert.equal(init?.method, "POST");
    assert.equal(
      init?.headers && (init.headers as Record<string, string>)["Content-Type"],
      "application/json",
    );
    assert.equal(typeof init?.body, "string");
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const result = await postWorkflow(
      payload,
      "http://localhost:8080/api/workflows/run",
    );
    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.bodyText.includes('"ok": true'), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("postWorkflow retorna error de backend sin lanzar excepcion", async () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = async () =>
    new Response("backend error", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });

  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const result = await postWorkflow(
      payload,
      "http://localhost:8080/api/workflows/run",
    );
    assert.equal(result.ok, false);
    assert.equal(result.status, 500);
    assert.equal(result.bodyText, "backend error");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("syncWorkflowCanvasSnapshot no llama backend sin apiBaseUrl", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  const fetchMock = async () => {
    called = true;
    return new Response("", { status: 200 });
  };
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    await syncWorkflowCanvasSnapshot(
      "wf-1",
      { nodes: [], connections: [] },
      "",
    );
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
