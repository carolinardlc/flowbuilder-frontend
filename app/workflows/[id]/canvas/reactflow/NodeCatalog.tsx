"use client";

/**
 * NodeCatalog - Premium node catalog with SVG icons and card-based layout
 *
 * Design based on Workflow Builder UI Design reference:
 * - SVG icons with colored backgrounds per node type
 * - Search input with search icon
 * - Card hover effects with shadow and border
 * - Tip section at bottom
 */

import { useMemo, useState } from "react";
import type { NodeType } from "./types";

// SVG Icons matching the reference design
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const GitBranchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

type CatalogItem = {
  type: NodeType;
  title: string;
  description: string;
  badge?: string;
  icon: React.FC;
  color: string;
  bgColor: string;
};

type NodeCatalogProps = {
  onAddNode: (type: NodeType) => void;
  hasStartNode: boolean;
};

// Catalog items with SVG icons and kid-friendly color palette
const CATALOG_ITEMS: CatalogItem[] = [
  {
    type: "START",
    title: "Inicio",
    description: "Punto de entrada del workflow",
    badge: "Único",
    icon: PlayIcon,
    color: "#ffffff",
    bgColor: "#10b981", // Green
  },
  {
    type: "HTTP_REQUEST",
    title: "HTTP Request",
    description: "Realiza peticiones HTTP",
    icon: GlobeIcon,
    color: "#ffffff",
    bgColor: "#3b82f6", // Blue
  },
  {
    type: "COMMAND",
    title: "Command",
    description: "Ejecuta comandos del sistema",
    icon: TerminalIcon,
    color: "#ffffff",
    bgColor: "#9e8bff", // Lavender
  },
  {
    type: "CONDITIONAL",
    title: "Conditional",
    description: "Bifurca el flujo según condición",
    icon: GitBranchIcon,
    color: "#ffffff",
    bgColor: "#f59e0b", // Amber
  },
];

export default function NodeCatalog({
  onAddNode,
  hasStartNode,
}: NodeCatalogProps) {
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<NodeType | null>(null);

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

  const handleAddNode = (item: CatalogItem) => {
    if (item.type === "START" && hasStartNode) {
      setNotice("Solo puede existir un nodo Inicio.");
      return;
    }
    setNotice(null);
    onAddNode(item.type);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#ffffff",
    }}>
      {/* Header with title and search */}
      <div style={{
        padding: "16px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <h3 style={{
          margin: "0 0 12px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: "#1f2937",
        }}>
          Catálogo de Nodos
        </h3>

        {/* Search input with icon */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
          }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Buscar nodos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              fontSize: "14px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              outline: "none",
              background: "#f9fafb",
              color: "#1f2937",
              transition: "border-color 150ms ease, box-shadow 150ms ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#9e8bff";
              e.target.style.boxShadow = "0 0 0 3px rgba(158, 139, 255, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Notice alert */}
      {notice && (
        <div style={{
          margin: "0 16px",
          padding: "10px 12px",
          background: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#92400e",
        }}>
          {notice}
        </div>
      )}

      {/* Node cards list */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isHovered = hoveredItem === item.type;

            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/reactflow", item.type);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => handleAddNode(item)}
                onMouseEnter={() => setHoveredItem(item.type)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px",
                  background: "#ffffff",
                  border: `1px solid ${isHovered ? item.bgColor : "#e5e7eb"}`,
                  borderRadius: "8px",
                  cursor: "grab",
                  transition: "all 150ms ease",
                  boxShadow: isHovered
                    ? "0 4px 12px rgba(0, 0, 0, 0.1)"
                    : "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* Icon container */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: item.bgColor,
                  color: item.color,
                  flexShrink: 0,
                }}>
                  <Icon />
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1f2937",
                    }}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span style={{
                        padding: "2px 8px",
                        fontSize: "11px",
                        fontWeight: 500,
                        background: "#f3f4f6",
                        color: "#6b7280",
                        borderRadius: "4px",
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#6b7280",
                    lineHeight: 1.4,
                  }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div style={{
            padding: "32px 16px",
            textAlign: "center",
          }}>
            <p style={{
              margin: 0,
              fontSize: "14px",
              color: "#6b7280",
            }}>
              No se encontraron nodos
            </p>
          </div>
        )}
      </div>

      {/* Tip section */}
      <div style={{
        padding: "16px",
        borderTop: "1px solid #e5e7eb",
        background: "#f9fafb",
      }}>
        <p style={{
          margin: 0,
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: 1.5,
        }}>
          💡 <strong>Tip:</strong> Arrastra o haz clic en un nodo para agregarlo al canvas
        </p>
      </div>
    </div>
  );
}
