"use client";

// This scaffold builds the 3-panel layout and toolbar using destination styles.
// ReactFlow remains minimal and empty; functionality will be layered later.

import ReactFlow, { Background, Controls, MiniMap } from "reactflow";

// Empty graph data keeps the scaffold deterministic and avoids business logic.
const initialNodes: never[] = [];
const initialEdges: never[] = [];

// Placeholder catalog items provide the visual structure without logic.
const placeholderCatalog = [
  {
    title: "Inicio",
    description: "Punto de entrada del workflow.",
    badge: "Único",
  },
  {
    title: "HTTP Request",
    description: "Realiza una petición HTTP.",
  },
  {
    title: "Command",
    description: "Ejecuta un comando del sistema.",
  },
  {
    title: "Conditional",
    description: "Bifurca el flujo según una condición.",
  },
];

// The component is still a scaffold; it focuses on layout only.
export default function ReactFlowCanvas() {
  return (
    <section className="canvas-shell rf-canvas-shell">
      {/* 3-panel layout: catalog, canvas, inspector. */}
      <div className="canvas-layout rf-canvas-layout">
        <aside className="canvas-panel rf-panel rf-catalog-panel">
          <div className="rf-panel-inner">
            <p className="panel-title">Catálogo de nodos</p>
            {/* The search input is a placeholder for now. */}
            <input
              className="form-input rf-search-input"
              placeholder="Buscar nodos..."
              aria-label="Buscar nodos"
            />
            <div className="rf-catalog-list">
              {placeholderCatalog.map((item) => (
                <div key={item.title} className="rf-catalog-card">
                  <div className="rf-catalog-icon" aria-hidden="true">
                    ●
                  </div>
                  <div className="rf-catalog-meta">
                    <div className="rf-catalog-row">
                      <span className="rf-catalog-title">{item.title}</span>
                      {item.badge ? (
                        <span className="badge rf-badge">{item.badge}</span>
                      ) : null}
                    </div>
                    <p className="rf-catalog-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="rf-panel-hint">
              Arrastra o haz clic para agregar un nodo.
            </p>
          </div>
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
              // The stub uses empty graph data to confirm the ReactFlow mount works.
              nodes={initialNodes}
              edges={initialEdges}
              fitView
            >
              {/* Dotted background will be tuned later to match the theme. */}
              <Background variant="dots" gap={16} size={1} />
              {/* Controls and minimap are included to validate ReactFlow UI elements. */}
              <Controls />
              <MiniMap />
            </ReactFlow>
            <div className="rf-canvas-placeholder">
              Canvas vacío: aquí vivirá ReactFlow con nodos reales.
            </div>
          </div>
        </section>

        <aside className="canvas-panel canvas-panel-right rf-panel rf-inspector-panel">
          <div className="rf-panel-inner">
            <p className="panel-title">Inspector</p>
            {/* Tabs are placeholders and will be wired later. */}
            <div className="rf-tabs" role="tablist" aria-label="Inspector tabs">
              <button
                className="rf-tab rf-tab-active"
                type="button"
                role="tab"
                aria-selected="true"
              >
                Configuración
              </button>
              <button
                className="rf-tab"
                type="button"
                role="tab"
                aria-selected="false"
              >
                Errores
              </button>
            </div>
            <div className="panel-card rf-inspector-card">
              <p className="panel-label">Estado</p>
              <p className="panel-value">Selecciona un nodo para editar.</p>
              <p className="panel-label">Tip</p>
              <p className="panel-value">
                El inspector mostrará formularios por tipo de nodo.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
