"use client";

// This canvas brings together layout, core ReactFlow interactions, and persistence.
// It keeps styling aligned with the destination theme while matching reference UX.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "reactflow";
import CustomNode from "./CustomNode";
import type { CanvasNodeData } from "./canvas-types";
import NodeCatalog from "./NodeCatalog";
import NodeInspector from "./NodeInspector";
import ValidationPanel from "./ValidationPanel";
import {
  createDefaultNodeConfig,
  exportWorkflowToJSON,
  generateId,
  validateWorkflow,
} from "./workflow-utils";
import type {
  NodeType,
  ValidationReport,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
} from "./types";
import { useWorkflows } from "../../../../context/WorkflowsContext";

// Local node data aligns with the workflow contract while staying ReactFlow-friendly.
type ReactFlowNodeData = CanvasNodeData;

// Start with an empty edge list; user connections will populate this.
const initialEdges: Edge[] = [];

// Storage key prefix isolates the new ReactFlow canvas from the legacy one.
const STORAGE_PREFIX = "workflow-reactflow";

// The component now wires layout plus core interactions; advanced panels come later.
export default function ReactFlowCanvas() {
  // Route params give us the workflow identifier for storage and metadata.
  const params = useParams<{ id: string }>();
  const routeWorkflowId =
    typeof params?.id === "string" ? params.id : "draft";

  // Workflows context provides name/description from the existing list.
  const { workflows } = useWorkflows();
  const workflowFromContext = useMemo(
    () => workflows.find((workflow) => workflow.id === routeWorkflowId),
    [routeWorkflowId, workflows]
  );

  // ReactFlow helpers keep drag updates and state management ergonomic.
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  // Selection state powers the right-hand inspector panel.
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // ReactFlow instance allows us to focus nodes from the validation panel.
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Workflow metadata is persisted alongside nodes/edges for export/import.
  const [workflowMeta, setWorkflowMeta] = useState<{
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }>(() => {
    const now = new Date().toISOString();
    return {
      id: routeWorkflowId,
      name: `Workflow ${routeWorkflowId}`,
      description: "",
      createdAt: now,
      updatedAt: now,
    };
  });

  // Import dialog state keeps JSON input and errors local.
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  // Validation panel state mirrors the reference UX.
  const [showValidation, setShowValidation] = useState(false);
  const [validationReport, setValidationReport] =
    useState<ValidationReport | null>(null);

  // Save indicators drive the toolbar status badge.
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Hydration flags avoid triggering autosave on initial load.
  const hasHydratedRef = useRef(false);
  const skipAutoSaveRef = useRef(true);
  const loadedFromStorageRef = useRef(false);

  // ReactFlow needs a node type map to render our custom node UI.
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // START node uniqueness is enforced in the catalog.
  const hasStartNode = useMemo(
    () => nodes.some((node) => node.data.nodeType === "START"),
    [nodes]
  );

  // Resolve the currently selected node for the inspector.
  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [nodes, selectedNodeId]);

  // Map node types to user-facing labels that match the destination language.
  const getNodeLabel = (nodeType: NodeType) => {
    switch (nodeType) {
      case "START":
        return "Inicio";
      case "HTTP_REQUEST":
        return "HTTP Request";
      case "COMMAND":
        return "Command";
      case "CONDITIONAL":
        return "Conditional";
      default:
        return nodeType;
    }
  };

  // Remove a node and any edges connected to it.
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId));
      setEdges((prev) =>
        prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
    },
    [setEdges, setNodes]
  );

  // Duplicate a node with a slight position offset for visibility.
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const duplicatedId = generateId();
      setNodes((prev) => {
        const node = prev.find((item) => item.id === nodeId);
        if (!node) return prev;
        if (node.data.nodeType === "START") return prev;

        const duplicated: Node<ReactFlowNodeData> = {
          ...node,
          id: duplicatedId,
          position: {
            x: node.position.x + 40,
            y: node.position.y + 40,
          },
          data: {
            ...node.data,
            label: `${node.data.label} (copia)`,
            onDelete: handleDeleteNode,
            onDuplicate: handleDuplicateNode,
          },
        };

        return [...prev, duplicated];
      });
      setSelectedNodeId(duplicatedId);
    },
    [handleDeleteNode, setNodes]
  );

  // Build node data with callbacks so the CustomNode can trigger actions.
  const buildNodeData = useCallback(
    (
      nodeType: NodeType,
      overrides?: {
        label?: string;
        config?: CanvasNodeData["config"];
        isConfigured?: boolean;
      }
    ): ReactFlowNodeData => ({
      label: overrides?.label ?? getNodeLabel(nodeType),
      nodeType,
      config: overrides?.config ?? createDefaultNodeConfig(nodeType),
      isConfigured: overrides?.isConfigured ?? nodeType === "START",
      onDelete: handleDeleteNode,
      onDuplicate: handleDuplicateNode,
    }),
    [handleDeleteNode, handleDuplicateNode]
  );

  // Add a node at a slightly offset position to keep new nodes visible.
  const handleAddNode = useCallback(
    (nodeType: NodeType) => {
      const id = generateId();
      const offset = nodes.length * 40;

      const newNode: Node<ReactFlowNodeData> = {
        id,
        type: "custom",
        position: { x: 220 + offset, y: 120 + offset },
        data: buildNodeData(nodeType),
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(id);
    },
    [buildNodeData, nodes.length, setNodes]
  );

  // Convert workflow nodes to ReactFlow nodes for rendering.
  const mapWorkflowNodes = useCallback(
    (workflowNodes: WorkflowNode[]): Node<ReactFlowNodeData>[] => {
      return workflowNodes.map((node) => ({
        id: node.id,
        type: "custom",
        position: node.position,
        data: buildNodeData(node.type, {
          label: node.data.label,
          config: node.data.config,
          isConfigured: node.data.isConfigured,
        }),
      }));
    },
    [buildNodeData]
  );

  // Convert workflow edges to ReactFlow edges, ensuring ids exist.
  const mapWorkflowEdges = useCallback(
    (workflowEdges: WorkflowEdge[]): Edge[] => {
      return workflowEdges.map((edge) => ({
        id: edge.id ?? generateId(),
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type ?? "default",
        // Map conditional labels to handles so the UI anchors correctly.
        sourceHandle:
          edge.label === "TRUE"
            ? "true"
            : edge.label === "FALSE"
              ? "false"
              : undefined,
      }));
    },
    []
  );

  // Serialize the current canvas to the workflow export shape.
  const buildWorkflowPayload = useCallback(
    (overrides?: Partial<Workflow>): Workflow => {
      const nodesPayload: WorkflowNode[] = nodes.map((node) => ({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: {
          label: node.data.label,
          config: node.data.config,
          isConfigured: node.data.isConfigured,
        },
      }));

      const edgesPayload: WorkflowEdge[] = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type,
      }));

      return {
        id: workflowMeta.id,
        name: workflowMeta.name,
        description: workflowMeta.description,
        nodes: nodesPayload,
        edges: edgesPayload,
        createdAt: workflowMeta.createdAt,
        updatedAt: workflowMeta.updatedAt,
        ...overrides,
      };
    },
    [edges, nodes, workflowMeta]
  );

  // Write a workflow payload into localStorage and update status flags.
  const persistWorkflow = useCallback(
    (payload: Workflow) => {
      setIsSaving(true);
      try {
        const storageKey = `${STORAGE_PREFIX}:${routeWorkflowId}`;
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastSavedAt(new Date(payload.updatedAt));
        setIsDirty(false);
      } finally {
        setIsSaving(false);
      }
    },
    [routeWorkflowId]
  );

  // Manual save updates the timestamp and persists the payload.
  const handleSave = useCallback(() => {
    const updatedAt = new Date().toISOString();
    const payload = buildWorkflowPayload({ updatedAt });
    setWorkflowMeta((prev) => ({ ...prev, updatedAt }));
    persistWorkflow(payload);
  }, [buildWorkflowPayload, persistWorkflow]);

  // Export always uses the current payload and triggers a JSON download.
  const handleExport = useCallback(() => {
    const payload = buildWorkflowPayload();
    const json = exportWorkflowToJSON(payload);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${payload.name || "workflow"}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [buildWorkflowPayload]);

  // Import replaces the current canvas with the JSON payload.
  const handleImport = useCallback(() => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJson) as Partial<Workflow>;
      if (!parsed.nodes || !parsed.edges || !parsed.name) {
        setImportError(
          "El JSON debe incluir name, nodes y edges para importar."
        );
        return;
      }

      const now = new Date().toISOString();
      const imported: Workflow = {
        id: parsed.id ?? generateId(),
        name: parsed.name ?? "Workflow importado",
        description: parsed.description ?? "",
        nodes: parsed.nodes as WorkflowNode[],
        edges: parsed.edges as WorkflowEdge[],
        createdAt: parsed.createdAt ?? now,
        updatedAt: parsed.updatedAt ?? now,
      };

      setNodes(mapWorkflowNodes(imported.nodes));
      setEdges(mapWorkflowEdges(imported.edges));
      setWorkflowMeta({
        id: imported.id,
        name: imported.name,
        description: imported.description,
        createdAt: imported.createdAt,
        updatedAt: imported.updatedAt,
      });
      setSelectedNodeId(null);
      setShowImportDialog(false);
      setImportJson("");
      skipAutoSaveRef.current = true;
      loadedFromStorageRef.current = true;
      persistWorkflow(imported);
    } catch (_error) {
      setImportError("El JSON no es válido. Revisa el formato.");
    }
  }, [
    importJson,
    mapWorkflowEdges,
    mapWorkflowNodes,
    persistWorkflow,
    setEdges,
    setNodes,
  ]);

  // Load saved workflow from localStorage on first mount.
  useEffect(() => {
    const storageKey = `${STORAGE_PREFIX}:${routeWorkflowId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      loadedFromStorageRef.current = false;
      hasHydratedRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Workflow;
      if (parsed?.nodes && parsed?.edges) {
        setNodes(mapWorkflowNodes(parsed.nodes));
        setEdges(mapWorkflowEdges(parsed.edges));
        setWorkflowMeta({
          id: parsed.id,
          name: parsed.name,
          description: parsed.description,
          createdAt: parsed.createdAt,
          updatedAt: parsed.updatedAt,
        });
        setLastSavedAt(new Date(parsed.updatedAt));
        skipAutoSaveRef.current = true;
        loadedFromStorageRef.current = true;
      }
    } catch (_error) {
      // If storage is corrupted, we fall back to an empty canvas.
    } finally {
      hasHydratedRef.current = true;
    }
  }, [mapWorkflowEdges, mapWorkflowNodes, routeWorkflowId, setEdges, setNodes]);

  // If context metadata is available and we are not hydrated, sync it.
  useEffect(() => {
    if (!workflowFromContext) return;
    if (loadedFromStorageRef.current) return;
    setWorkflowMeta((prev) => ({
      ...prev,
      name: workflowFromContext.name,
      description: workflowFromContext.description,
    }));
  }, [workflowFromContext]);

  // Autosave on changes after hydration, with a small debounce.
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }

    setIsDirty(true);
    const timeout = window.setTimeout(() => {
      handleSave();
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [edges, handleSave, nodes, workflowMeta.description, workflowMeta.name]);

  // Update a node's config and label from the inspector panel.
  const handleUpdateNodeConfig = useCallback(
    (nodeId: string, config: CanvasNodeData["config"], label: string) => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              label,
              config,
              // Saving from the inspector marks the node as configured.
              isConfigured: true,
            },
          };
        })
      );
    },
    [setNodes]
  );

  // Apply connection rules: START cannot receive edges, CONDITIONAL caps outputs.
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) return;
      if (targetNode.data.nodeType === "START") return;
      if (connection.source === connection.target) return;

      setEdges((prev) => {
        // Enforce CONDITIONAL rules with TRUE/FALSE labels.
        if (sourceNode.data.nodeType === "CONDITIONAL") {
          const outgoing = prev.filter(
            (edge) => edge.source === connection.source
          );

          if (outgoing.length >= 2) return prev;

          const hasTrue = outgoing.some((edge) => edge.label === "TRUE");
          const hasFalse = outgoing.some((edge) => edge.label === "FALSE");

          let label: "TRUE" | "FALSE" | null = null;
          if (connection.sourceHandle === "true") label = "TRUE";
          if (connection.sourceHandle === "false") label = "FALSE";
          if (!label) {
            if (!hasTrue) label = "TRUE";
            else if (!hasFalse) label = "FALSE";
          }

          if (!label) return prev;
          if (outgoing.some((edge) => edge.label === label)) return prev;

          const conditionalEdge: Edge = {
            id: generateId(),
            source: connection.source,
            target: connection.target,
            label,
            sourceHandle: connection.sourceHandle ?? undefined,
            type: "conditional",
          };

          return [...prev, conditionalEdge];
        }

        const newEdge: Edge = {
          id: generateId(),
          source: connection.source,
          target: connection.target,
          type: "default",
        };

        return addEdge(newEdge, prev);
      });
    },
    [nodes, setEdges]
  );

  // Compute a human-readable status label for the toolbar.
  const saveStatus = useMemo(() => {
    if (isSaving) return "Guardando...";
    if (isDirty) return "Sin guardar";
    if (!lastSavedAt) return "Sin guardar";
    return `Guardado ${lastSavedAt.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [isDirty, isSaving, lastSavedAt]);

  // Run validation using the shared rules and open the panel.
  const handleValidate = useCallback(() => {
    const payload = buildWorkflowPayload();
    const report = validateWorkflow(payload);
    setValidationReport(report);
    setShowValidation(true);
  }, [buildWorkflowPayload]);

  // Focus a node from the validation panel using ReactFlow's viewport API.
  const handleFocusNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node || !reactFlowInstance) return;

      setSelectedNodeId(nodeId);
      const centerX = node.position.x + 100;
      const centerY = node.position.y + 50;
      reactFlowInstance.setCenter(centerX, centerY, {
        zoom: 1.3,
        duration: 600,
      });
    },
    [nodes, reactFlowInstance]
  );

  return (
    <section className="canvas-shell rf-canvas-shell">
      {/* 3-panel layout: catalog, canvas, inspector. */}
      <div className="canvas-layout rf-canvas-layout">
        <aside className="canvas-panel rf-panel rf-catalog-panel">
          {/* Node catalog now handles search and START uniqueness. */}
          <NodeCatalog onAddNode={handleAddNode} hasStartNode={hasStartNode} />
        </aside>

        <section className="canvas-stage rf-canvas-stage">
          {/* Toolbar mirrors the reference UX but uses destination styles. */}
          <div className="canvas-toolbar rf-toolbar">
            <div className="rf-toolbar-left">
              <p className="hero-kicker">
                Workflows / {workflowMeta.name || "Canvas"}
              </p>
              <h2 className="workflows-title">{workflowMeta.name}</h2>
              <p className="workflows-subtitle">
                {workflowMeta.description ||
                  "Diseña tu flujo con el lienzo interactivo."}
              </p>
            </div>
            <div className="canvas-actions rf-toolbar-actions">
              <span className="canvas-badge">{saveStatus}</span>
              <button
                className="btn-secondary"
                type="button"
                onClick={handleValidate}
              >
                Validar
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setShowImportDialog(true)}
              >
                Importar
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={handleExport}
              >
                Exportar
              </button>
              <button className="btn-primary" type="button" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>

          {/* Canvas container keeps the existing destination look & feel. */}
          <div className="canvas-scroll rf-canvas-scroll">
            <ReactFlow
              // The canvas now renders the nodes created from the catalog.
              nodes={nodes}
              edges={edges}
              // fitView keeps the empty canvas centered for a cleaner initial view.
              fitView
              // The className allows us to style ReactFlow with destination tokens.
              className="rf-reactflow"
              // ReactFlow handlers keep the UX responsive to drag updates.
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onInit={setReactFlowInstance}
              // Click handlers keep the inspector in sync with selection.
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
            >
              {/* Dotted background uses destination CSS variables for color. */}
              <Background
                variant="dots"
                gap={20}
                size={1}
                color="var(--rf-grid)"
              />
              {/* Controls are anchored bottom-left to match the target UX. */}
              <Controls position="bottom-left" />
              {/* Minimap is anchored bottom-right and styled via CSS. */}
              <MiniMap position="bottom-right" className="rf-minimap" />
            </ReactFlow>
            {/* Keep the placeholder visible only when the canvas has no nodes. */}
            {nodes.length === 0 ? (
              <div className="rf-canvas-placeholder">
                Canvas vacío: aquí vivirá ReactFlow con nodos reales.
              </div>
            ) : null}
          </div>
        </section>

        <aside className="canvas-panel canvas-panel-right rf-panel rf-inspector-panel">
          {/* The inspector reflects the selected node and updates its config. */}
          <NodeInspector
            node={selectedNode}
            onUpdateConfig={handleUpdateNodeConfig}
          />
        </aside>
      </div>

      {/* Import dialog keeps JSON input self-contained and uses existing modal styles. */}
      {showImportDialog ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="workflows-title">Importar workflow</h2>
            <p className="workflows-subtitle">
              Pega el JSON del workflow para reemplazar el canvas actual.
            </p>
            <textarea
              className="form-textarea"
              rows={12}
              placeholder='{"name": "Mi workflow", "nodes": [], "edges": []}'
              value={importJson}
              onChange={(event) => setImportJson(event.target.value)}
            />
            {importError ? (
              <p className="rf-import-error">{importError}</p>
            ) : null}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportError(null);
                }}
              >
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleImport}>
                Importar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Validation panel appears at the bottom when requested. */}
      {showValidation && validationReport ? (
        <ValidationPanel
          report={validationReport}
          onClose={() => setShowValidation(false)}
          onFocusNode={handleFocusNode}
        />
      ) : null}
    </section>
  );
}
