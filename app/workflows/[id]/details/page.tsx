"use client";

import Layout from "@/app/components/Layout";
import { useWorkflows } from "@/app/context/WorkflowsContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "reactflow";



const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  VALID: "Validado",
  INVALID: "Inválido",
};

export default function WorkflowBuilderPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;

  const { workflows, updateWorkflowGraph } = useWorkflows();

  const workflow = useMemo(
    () => workflows.find((w) => w.id === workflowId),
    [workflows, workflowId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!workflow) return;
      const nextNodes = applyNodeChanges(changes, workflow.nodes);
      updateWorkflowGraph(workflow.id, nextNodes, workflow.edges);
    },
    [workflow, updateWorkflowGraph]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!workflow) return;
      const nextEdges = applyEdgeChanges(changes, workflow.edges);
      updateWorkflowGraph(workflow.id, workflow.nodes, nextEdges);
    },
    [workflow, updateWorkflowGraph]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!workflow) return;
      const nextEdges = addEdge(connection, workflow.edges);
      updateWorkflowGraph(workflow.id, workflow.nodes, nextEdges);
    },
    [workflow, updateWorkflowGraph]
  );

  // Si no existe (por ejemplo, refresh y tu estado aún no es persistente)
  if (!workflow) {
    return (


      <Layout>
     
        <section className="hero">
          <div className="app-card">
            <h1 className="workflows-title">Workflow no encontrado</h1>
            <p className="workflows-subtitle">
              Puede que no exista o que se haya perdido al recargar (aún no hay persistencia).
            </p>
            <div className="form-actions">
              <Link href="/workflows" className="btn-primary link-button">
                Volver al listado
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero">
        {/* ✅ Header del workflow (detalle simple) */}
        <div className="workflows-header">
          <div>
            <p className="hero-kicker">Workflows / {workflow.id}</p>
            <h1 className="workflows-title">{workflow.name}</h1>
            <p className="workflows-subtitle">{workflow.description}</p>
          </div>

          <div className="workflows-actions">
            <span className="badge badge-progress">
              {statusLabel[workflow.status] ?? workflow.status}
            </span>

            <Link href={`/workflows/${workflow.id}/edit`} className="btn-secondary link-button">
              Editar metadata
            </Link>

            <Link href="/workflows" className="btn-secondary link-button">
              Volver
            </Link>
          </div>
        </div>

        {/* ✅ Layout: Canvas + Panel derecho (detalle del nodo, por ahora simple) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          {/* Canvas */}
          <div
            style={{
              height: "70vh",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              background: "white",
            }}
          >
            <ReactFlow
              nodes={workflow.nodes}
              edges={workflow.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </div>

          {/* Panel derecho (detalle) */}
          <aside className="app-card" style={{ height: "70vh", overflow: "auto" }}>
            <h2 className="feature-title">Detalle</h2>
            <p className="feature-text">
              Aquí irá la configuración del nodo seleccionado (HTTP/COMMAND/CONDITIONAL).
            </p>

            <div style={{ marginTop: 16 }}>
              <h3 className="feature-title">Acciones (más adelante)</h3>
              <ul className="feature-text">
                <li>Validar workflow (START único, sin ciclos, alcanzables)</li>
                <li>Exportar JSON</li>
                <li>Importar JSON</li>
                <li>Ejecutar (crear Run + StepRuns)</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
