import { assert, test } from "vitest";
import {
  calculateNextNodeId,
  createNode,
} from "../app/workflows/[id]/canvas/utils/nodeUtils";
import { validateNoCycles } from "../app/workflows/[id]/canvas/domain/validation/validateNoCycles";
import { validateStartNode } from "../app/workflows/[id]/canvas/domain/validation/validateStartNode";
import type {
  Connection,
  WorkflowNodeData,
} from "../app/workflows/[id]/canvas/types";

test("createNode crea nodo con id y coordenadas validas", () => {
  const node = createNode("START", -10, 25, 7);

  assert.equal(node.id, "node-7");
  assert.equal(node.type, "START");
  assert.equal(node.x, 0);
  assert.equal(node.y, 25);
});

test("validateStartNode exige que exista un nodo START", () => {
  const nodesWithoutStart: WorkflowNodeData[] = [
    { id: "node-2", title: "Comando", type: "COMMAND", x: 0, y: 0 },
    { id: "node-3", title: "Fin", type: "END", x: 0, y: 0 },
  ];

  const errors = validateStartNode(nodesWithoutStart);

  assert.equal(errors.length > 0, true);
  assert.equal(errors[0].code, "START_MISSING");
});

test("calculateNextNodeId devuelve el siguiente consecutivo", () => {
  const nodes: WorkflowNodeData[] = [
    { id: "node-1", title: "Inicio", type: "START", x: 0, y: 0 },
    { id: "node-4", title: "HTTP", type: "HTTP_REQUEST", x: 0, y: 0 },
    { id: "node-3", title: "Fin", type: "END", x: 0, y: 0 },
  ];

  const next = calculateNextNodeId(nodes);
  assert.equal(next, 5);
});

test("validateNoCycles reporta error cuando hay ciclo", () => {
  const nodes: WorkflowNodeData[] = [
    { id: "node-1", title: "Inicio", type: "START", x: 0, y: 0 },
    { id: "node-2", title: "Comando", type: "COMMAND", x: 0, y: 0 },
    { id: "node-3", title: "Fin", type: "END", x: 0, y: 0 },
  ];

  const connections: Connection[] = [
    { id: "c-1", from: "node-1", to: "node-2" },
    { id: "c-2", from: "node-2", to: "node-3" },
    { id: "c-3", from: "node-3", to: "node-1" },
  ];

  const errors = validateNoCycles(nodes, connections);

  assert.equal(errors.length > 0, true);
  assert.equal(errors[0].code, "CYCLE_DETECTED");
});
