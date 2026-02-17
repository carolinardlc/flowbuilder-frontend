import test from "node:test";
import assert from "node:assert/strict";
import {
  downloadWorkflowJson,
  toWorkflowJsonString,
} from "../workflowFile";
import type { ExportWorkflowJson } from "../../domain/serialization";

const exportJson: ExportWorkflowJson = {
  id: "wf-1",
  name: "My Workflow",
  nodes: [{ id: "n1", name: "Inicio", type: "START" }],
  connections: [],
};

test("toWorkflowJsonString serializa contenido JSON", () => {
  const json = toWorkflowJsonString(exportJson);
  assert.equal(json.includes('"id": "wf-1"'), true);
  assert.equal(json.includes('"type": "START"'), true);
});

test("downloadWorkflowJson usa APIs del navegador para descargar", () => {
  const originalDocument = globalThis.document;
  const originalUrl = globalThis.URL;

  let createdObjectUrl = "";
  let clicked = false;
  let removed = false;
  let downloadName = "";

  const fakeLink = {
    href: "",
    download: "",
    click: () => {
      clicked = true;
      downloadName = fakeLink.download;
    },
    remove: () => {
      removed = true;
    },
  };

  const fakeDocument = {
    createElement: () => fakeLink,
    body: {
      appendChild: () => undefined,
    },
  } as unknown as Document;

  const fakeUrl = {
    createObjectURL: () => {
      createdObjectUrl = "blob:mock";
      return createdObjectUrl;
    },
    revokeObjectURL: (value: string) => {
      assert.equal(value, "blob:mock");
    },
  } as unknown as typeof URL;

  Object.defineProperty(globalThis, "document", {
    value: fakeDocument,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "URL", {
    value: fakeUrl,
    configurable: true,
    writable: true,
  });

  try {
    downloadWorkflowJson(exportJson, "Workflow Demo");
    assert.equal(createdObjectUrl, "blob:mock");
    assert.equal(clicked, true);
    assert.equal(removed, true);
    assert.equal(downloadName, "workflow-demo.json");
  } finally {
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "URL", {
      value: originalUrl,
      configurable: true,
      writable: true,
    });
  }
});

test("downloadWorkflowJson falla en entornos sin document", () => {
  const originalDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    value: undefined,
    configurable: true,
    writable: true,
  });

  try {
    assert.throws(
      () => downloadWorkflowJson(exportJson, "Workflow Demo"),
      /Download API no disponible/,
    );
  } finally {
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
  }
});
