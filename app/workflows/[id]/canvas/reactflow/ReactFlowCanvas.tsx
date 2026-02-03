"use client";

/**
 * ReactFlowCanvas - Main workflow builder canvas component
 *
 * This canvas brings together layout, core ReactFlow interactions, and persistence.
 * It keeps styling aligned with the destination theme while matching reference UX.
 *
 * Key features:
 * - 3-panel layout: catalog | canvas | inspector
 * - Drag and drop nodes from catalog to canvas
 * - Interactive node connections with ReactFlow
 * - Auto-save with status indicator
 * - Import/Export workflow JSON
 * - Validation panel with error/warning feedback
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlowProvider,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "reactflow";

// CRITICAL: Import ReactFlow base styles - without this, nodes won't render correctly
import "reactflow/dist/style.css";

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

/**
 * Inner canvas component that contains all ReactFlow logic.
 * This is wrapped by ReactFlowProvider in the exported component.
 */
function ReactFlowCanvasInner() {
  // Reference to the ReactFlow wrapper for drag-drop positioning
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
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
        label: typeof edge.label === "string" ? edge.label : undefined,
        type: edge.type as WorkflowEdge["type"],
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

          // Ensure source and target are not null before creating edge
          if (!connection.source || !connection.target) return prev;

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

        // Standard single-output node: create normal edge
        if (!connection.source || !connection.target) return prev;

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

  /**
   * Handles drag over event for the canvas area.
   * Required to enable drop functionality.
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  /**
   * Handles drop event when a node is dragged from the catalog onto the canvas.
   * Creates a new node at the drop position.
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Get the node type from the drag data
      const nodeType = event.dataTransfer.getData("application/reactflow") as NodeType;
      if (!nodeType) return;

      // Prevent adding multiple START nodes
      if (nodeType === "START" && hasStartNode) return;

      // Calculate drop position relative to the ReactFlow canvas
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create and add the new node
      const id = generateId();
      const newNode: Node<ReactFlowNodeData> = {
        id,
        type: "custom",
        position,
        data: buildNodeData(nodeType),
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(id);
    },
    [buildNodeData, hasStartNode, reactFlowInstance, setNodes]
  );

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
      {/* Full-width toolbar header - spans entire page width */}
      <header className="rf-toolbar-header">
        <div className="rf-toolbar-left">
          <a href="/workflows" className="rf-toolbar-back" title="Volver a workflows">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </a>
          <div className="rf-toolbar-breadcrumb">
            <a href="/workflows">Workflows</a>
            <span className="rf-breadcrumb-sep">&gt;</span>
            <span className="rf-toolbar-name">{workflowMeta.name || "Sin nombre"}</span>
          </div>
        </div>

        <div className="rf-toolbar-center">
          {saveStatus}
        </div>

        <div className="rf-toolbar-actions">
          <button
            className="rf-action-btn"
            type="button"
            onClick={handleValidate}
            title="Validar workflow"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Validar</span>
          </button>
          <button
            className="rf-action-btn"
            type="button"
            onClick={() => setShowImportDialog(true)}
            title="Importar workflow"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Importar</span>
          </button>
          <button
            className="rf-action-btn"
            type="button"
            onClick={handleExport}
            title="Exportar workflow"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Exportar</span>
          </button>
          <button className="rf-action-btn rf-action-primary" type="button" onClick={handleSave} title="Guardar workflow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Guardar</span>
          </button>
        </div>
      </header>

      {/* 3-panel layout: catalog, canvas, inspector */}
      <div className="canvas-layout rf-canvas-layout">
        {/* Left panel: Node Catalog */}
        <aside className="canvas-panel rf-panel rf-catalog-panel">
          <NodeCatalog onAddNode={handleAddNode} hasStartNode={hasStartNode} />
        </aside>

        {/* Center: Canvas area */}
        <section className="canvas-stage rf-canvas-stage">
          <div
            className="canvas-scroll rf-canvas-scroll"
            ref={reactFlowWrapper}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              className="rf-reactflow"
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onInit={setReactFlowInstance}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="var(--rf-grid)"
              />
              <Controls position="bottom-left" />
              <MiniMap position="bottom-right" className="rf-minimap" />
            </ReactFlow>
            {nodes.length === 0 ? (
              <div className="rf-canvas-placeholder">
                Canvas vacío: aquí vivirá ReactFlow con nodos reales.
              </div>
            ) : null}
          </div>
        </section>

        {/* Right panel: Node Inspector */}
        <aside className="canvas-panel canvas-panel-right rf-panel rf-inspector-panel">
          <NodeInspector
            node={selectedNode}
            onUpdateConfig={handleUpdateNodeConfig}
          />
        </aside>
      </div>


      {/* Import dialog keeps JSON input self-contained and uses existing modal styles. */}
      {
        showImportDialog ? (
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
        ) : null
      }

      {/* Validation panel appears at the bottom when requested. */}
      {
        showValidation && validationReport ? (
          <ValidationPanel
            report={validationReport}
            onClose={() => setShowValidation(false)}
            onFocusNode={handleFocusNode}
          />
        ) : null
      }
    </section >
  );
}

/**
 * Main export component that wraps ReactFlowCanvasInner with ReactFlowProvider.
 * This provider is required for ReactFlow hooks to function correctly.
 */
export default function ReactFlowCanvas() {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasInner />
    </ReactFlowProvider>
  );
}
