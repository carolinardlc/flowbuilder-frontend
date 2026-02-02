"use client";

// This scaffold builds the 3-panel layout and toolbar using destination styles.
// Core interactions (add, move, connect, delete, duplicate) are now enabled.

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import CustomNode from "./CustomNode";
import type { CanvasNodeData } from "./canvas-types";
import NodeCatalog from "./NodeCatalog";
import { createDefaultNodeConfig, generateId } from "./workflow-utils";
import type { NodeType } from "./types";
import NodeInspector from "./NodeInspector";

// Local node data aligns with the workflow contract while staying ReactFlow-friendly.
type ReactFlowNodeData = CanvasNodeData;

// Start with an empty edge list; user connections will populate this.
const initialEdges: Edge[] = [];


// The component now wires layout plus core interactions; advanced panels come later.
export default function ReactFlowCanvas() {
  // ReactFlow helpers keep drag updates and state management ergonomic.
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNodeData>([]);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);
  // Selection state powers the right-hand inspector panel.
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
      _setEdges((prev) =>
        prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
    },
    [_setEdges, setNodes]
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
    (nodeType: NodeType): ReactFlowNodeData => ({
      label: getNodeLabel(nodeType),
      nodeType,
      config: createDefaultNodeConfig(nodeType),
      isConfigured: nodeType === "START",
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

      _setEdges((prev) => {
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
    [_setEdges, nodes]
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
              <p className="hero-kicker">Workflows / Canvas</p>
              <h2 className="workflows-title">Editor visual</h2>
              <p className="workflows-subtitle">
                Diseña tu flujo con el lienzo interactivo.
              </p>
            </div>
            <div className="canvas-actions rf-toolbar-actions">
              <span className="canvas-badge">Guardado hace 1 min</span>
              <button className="btn-secondary" type="button">
                Validar
              </button>
              <button className="btn-secondary" type="button">
                Importar
              </button>
              <button className="btn-secondary" type="button">
                Exportar
              </button>
              <button className="btn-primary" type="button">
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
    </section>
  );
}
