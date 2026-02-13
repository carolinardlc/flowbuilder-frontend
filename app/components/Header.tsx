"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkflows } from "../context/WorkflowsContext";
import {
  convertWorkflowToCanvasSnapshot,
  parseWorkflowImportJson,
} from "../workflows/[id]/canvas/utils/importWorkflow";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Workflows", href: "/workflows" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { upsertWorkflow } = useWorkflows();

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawJson = String(e.target?.result ?? "");
      const parsed = parseWorkflowImportJson(rawJson);

      if (!parsed.ok) {
        alert(parsed.error);
        event.target.value = "";
        return;
      }

      const snapshot = convertWorkflowToCanvasSnapshot(parsed.workflow);
      const storageKey = `workflow-canvas:${parsed.workflow.id}`;
      localStorage.removeItem(storageKey);
      localStorage.setItem(storageKey, JSON.stringify(snapshot));

      const formattedDate = new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      upsertWorkflow({
        id: parsed.workflow.id,
        name: parsed.workflow.name,
        description: `Importado desde JSON (${snapshot.nodes.length} nodos)`,
        status: "ACTIVE",
        date: formattedDate,
      });

      if (parsed.warning) {
        alert(parsed.warning);
      }

      const workflowRoute = `/workflows/${parsed.workflow.id}`;
      if (pathname.startsWith(workflowRoute)) {
        window.location.reload();
      } else {
        router.push(workflowRoute);
      }

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand-title">
          <span className="brand-pill">FlowBuilder</span>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div>
          <label className="nav-link cursor-pointer">
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </header>
  );
}
