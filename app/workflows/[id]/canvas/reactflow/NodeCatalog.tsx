"use client";

// This component renders the left-side node catalog with search and inline feedback.
// It remains UI-focused and delegates node creation to the parent via callbacks.

import { useMemo, useState } from "react";
import type { NodeType } from "./types";

type CatalogItem = {
  type: NodeType;
  title: string;
  description: string;
  badge?: string;
  icon: string;
};

type NodeCatalogProps = {
  // Parent callback that actually creates a node in the canvas.
  onAddNode: (type: NodeType) => void;
  // Flag used to enforce a single START node without relying on toasts.
  hasStartNode: boolean;
};

// Static catalog items keep the component deterministic and easy to extend.
const CATALOG_ITEMS: CatalogItem[] = [
  {
    type: "START",
    title: "Inicio",
    description: "Punto de entrada del workflow.",
    badge: "Único",
    icon: "▶",
  },
  {
    type: "HTTP_REQUEST",
    title: "HTTP Request",
    description: "Realiza una petición HTTP.",
    icon: "↗",
  },
  {
    type: "COMMAND",
    title: "Command",
    description: "Ejecuta un comando del sistema.",
    icon: "⌘",
  },
  {
    type: "CONDITIONAL",
    title: "Conditional",
    description: "Bifurca el flujo según una condición.",
    icon: "◆",
  },
];

export default function NodeCatalog({
  onAddNode,
  hasStartNode,
}: NodeCatalogProps) {
  // Local state drives the search filter and inline feedback messages.
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Filter items by title or description for a quick search experience.
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return CATALOG_ITEMS;

    return CATALOG_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    });
  }, [search]);

  // Handle add with a guard for the unique START node rule.
  const handleAddNode = (item: CatalogItem) => {
    if (item.type === "START" && hasStartNode) {
      setNotice("Solo puede existir un nodo Inicio.");
      return;
    }

    setNotice(null);
    onAddNode(item.type);
  };

  return (
    <div className="rf-panel-inner">
      <p className="panel-title">Catálogo de nodos</p>

      {/* Search input stays controlled to allow live filtering. */}
      <input
        className="form-input rf-search-input"
        placeholder="Buscar nodos..."
        aria-label="Buscar nodos"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {/* Inline notice avoids external toast dependencies. */}
      {notice ? <p className="rf-catalog-alert">{notice}</p> : null}

      <div className="rf-catalog-list">
        {filteredItems.map((item) => (
          <button
            key={item.type}
            type="button"
            className="rf-catalog-card"
            onClick={() => handleAddNode(item)}
            draggable
            onDragStart={(event) => {
              // Set the node type in dataTransfer for the canvas drop handler
              event.dataTransfer.setData("application/reactflow", item.type);
              event.dataTransfer.effectAllowed = "move";
            }}
          >
            <div className="rf-catalog-icon" aria-hidden="true">
              {item.icon}
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
          </button>
        ))}
      </div>

      {/* Empty state keeps the UX clear when no items match the search. */}
      {filteredItems.length === 0 ? (
        <p className="rf-catalog-empty">No se encontraron nodos.</p>
      ) : null}

      <p className="rf-panel-hint">
        Arrastra o haz clic para agregar un nodo.
      </p>
    </div>
  );
}
