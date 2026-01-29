/**
 * Hook personalizado para manejar React Flow
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
} from "@xyflow/react";

// Importar componentes de React Flow directamente
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { WorkflowFlowNode, WorkflowFlowEdge } from "../types/reactFlow";
import { NODE_TYPES } from "../constants/nodeTypes";
import { createNode } from "../utils/nodeUtils";

interface UseReactFlowProps {
  workflowId: string;
  initialNodes?: WorkflowFlowNode[];
  initialEdges?: WorkflowFlowEdge[];
}

export function useReactFlow({
  workflowId,
  initialNodes = [],
  initialEdges = [],
}: UseReactFlowProps) {
  // Estado de nodos y edges con los hooks de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Estado para el panel de configuración
  const [selectedNode, setSelectedNode] = useState<WorkflowFlowNode | null>(
    null,
  );
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Contador para nuevos nodos
  const [nextNodeId, setNextNodeId] = useState(1);

  /**
   * Crear un nuevo nodo
   */
  const createWorkflowNode = useCallback(
    (
      type: "start" | "action" | "conditional" | "end",
      position: { x: number; y: number },
    ): WorkflowFlowNode => {
      const workflowType = type.toUpperCase() as keyof typeof NODE_TYPES;
      const nodeConfig = NODE_TYPES[workflowType];

      return {
        id: `node-${nextNodeId}`,
        type,
        position,
        data: {
          title: `Nuevo ${nodeConfig.label}`,
          workflowType,
          config: {},
        },
      };
    },
    [nextNodeId],
  );

  /**
   * Agregar un nuevo nodo al canvas
   */
  const addNode = useCallback(
    (
      type: "start" | "action" | "conditional" | "end",
      position: { x: number; y: number },
    ) => {
      console.log("🎯 Creando nodo:", { type, position });
      const newNode = createWorkflowNode(type, position);
      console.log("✅ Nodo creado:", newNode);
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        console.log("📋 Total nodos:", newNodes);
        return newNodes;
      });
      setNextNodeId((prev) => prev + 1);
      return newNode;
    },
    [createWorkflowNode, setNodes],
  );

  /**
   * Manejar nuevas conexiones con validaciones
   */
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      console.log(" INTENTO DE CONEXIÓN:", params);

      // Validar que la conexión sea lógica
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      console.log(" Nodos encontrados:", { sourceNode, targetNode });

      if (!sourceNode || !targetNode) {
        console.warn(" Nodos no encontrados para la conexión");
        return;
      }

      // Validar tipos de conexión según los nodos
      const sourceType = sourceNode.type;
      const targetType = targetNode.type;

      console.log(" Tipos de conexión:", { sourceType, targetType });

      // START no puede ser target
      if (targetType === "start") {
        console.warn(" El nodo START no puede recibir conexiones");
        return;
      }

      // END no puede ser source
      if (sourceType === "end") {
        console.warn(" El nodo END no puede enviar conexiones");
        return;
      }

      // Evitar auto-conexiones
      if (params.source === params.target) {
        console.warn(" No se permite auto-conexión");
        return;
      }

      // Verificar si la conexión ya existe
      const connectionExists = edges.some(
        (edge) =>
          edge.source === params.source && edge.target === params.target,
      );

      if (connectionExists) {
        console.warn(" La conexión ya existe");
        return;
      }

      // Crear la conexión con estilo personalizado
      const newEdge: WorkflowFlowEdge = {
        id: `edge-${Date.now()}`,
        source: params.source,
        target: params.target,
        type: "smoothstep",
        animated: sourceType === "conditional",
        style: {
          stroke: sourceType === "conditional" ? "#9333ea" : "#64748b",
          strokeWidth: 2,
        },
      };

      console.log(" Creando conexión:", newEdge);
      setEdges((eds) => {
        const newEdges = [...eds, newEdge];
        console.log(" Total edges:", newEdges);
        return newEdges;
      });
    },
    [nodes, edges, setEdges],
  );

  /**
   * Cargar datos desde localStorage
   */
  const loadFromStorage = useCallback(() => {
    if (!workflowId) return;

    try {
      const storageKey = `reactflow-workflow:${workflowId}`;
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);

        if (savedNodes && savedNodes.length > 0) {
          setNodes(savedNodes);
          // Actualizar el contador de IDs
          const maxId = Math.max(
            ...savedNodes.map((n: any) => {
              const id = n.id.replace("node-", "");
              return parseInt(id) || 0;
            }),
          );
          setNextNodeId(maxId + 1);
        }

        if (savedEdges && savedEdges.length > 0) {
          setEdges(savedEdges);
        }
      }
    } catch (error) {
      console.error("Error cargando desde localStorage:", error);
    }
  }, [workflowId, setNodes, setEdges]);

  /**
   * Guardar datos en localStorage
   */
  const saveToStorage = useCallback(() => {
    if (!workflowId) return;

    try {
      const storageKey = `reactflow-workflow:${workflowId}`;
      const dataToSave = {
        nodes,
        edges,
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log("Workflow guardado en localStorage");
    } catch (error) {
      console.error("Error guardando en localStorage:", error);
    }
  }, [workflowId, nodes, edges]);

  // Cargar datos al montar
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Guardar datos cuando cambian
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [saveToStorage]);

  /**
   * Manejar selección de nodos
   */
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const workflowNode = node as WorkflowFlowNode;
    setSelectedNode(workflowNode);
    setIsConfigPanelOpen(true);
  }, []);

  /**
   * Cerrar panel de configuración
   */
  const closeConfigPanel = useCallback(() => {
    setIsConfigPanelOpen(false);
    setSelectedNode(null);
  }, []);

  /**
   * Guardar configuración de nodo
   */
  const saveNodeConfig = useCallback(
    (config: any) => {
      if (!selectedNode) return;

      setNodes((nds) =>
        nds.map((node) =>
          node.id === config.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  title: config.title,
                  config: config.config,
                },
              }
            : node,
        ),
      );

      closeConfigPanel();
    },
    [selectedNode, setNodes, closeConfigPanel],
  );

  /**
   * Eliminar un nodo
   */
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );

      if (selectedNode?.id === nodeId) {
        closeConfigPanel();
      }
    },
    [setNodes, setEdges, selectedNode, closeConfigPanel],
  );

  /**
   * Nodos disponibles para la paleta
   */
  const availableNodeTypes = useMemo(
    () => [
      {
        type: "start",
        label: "Inicio",
        icon: "🚀",
        color: NODE_TYPES.START.bgColor,
      },
      {
        type: "action",
        label: "Acción",
        icon: "⚡",
        color: NODE_TYPES.ACTION.bgColor,
      },
      {
        type: "conditional",
        label: "Condicional",
        icon: "🔀",
        color: NODE_TYPES.CONDITIONAL.bgColor,
      },
      { type: "end", label: "Fin", icon: "🏁", color: NODE_TYPES.END.bgColor },
    ],
    [],
  );

  return {
    // Estado
    nodes,
    edges,
    selectedNode,
    isConfigPanelOpen,
    availableNodeTypes,

    // Acciones
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    addNode,
    deleteNode,
    saveNodeConfig,
    closeConfigPanel,

    // Componentes de React Flow - Movidos fuera del return para evitar renderizado infinito
  };
}

// Exportar componentes de React Flow por separado
export { ReactFlow, Controls, Background, MiniMap };
