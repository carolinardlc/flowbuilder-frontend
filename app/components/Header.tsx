"use client";

import { validateWorkflowImport } from "../workflows/[id]/canvas/utils/validateImport"; // 👈 Importar la validación
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react"; // 1. Importamos useState
import { useWorkflows } from "../context/WorkflowsContext";
import { formatDateEs } from "../utils/formatDate";
import {
  convertWorkflowToCanvasSnapshot,
  parseWorkflowImportJson,
} from "../workflows/[id]/canvas/utils/importWorkflow";
import Toast from "./Toast"; // 2. Importamos el Toast

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Workflows", href: "/workflows" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { upsertWorkflow } = useWorkflows();
  
  // 3. Estado para manejar las notificaciones
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawJson = String(e.target?.result ?? "");
        let data;

        // 1. Verificamos que sea un JSON válido (sintaxis)
        try {
            data = JSON.parse(rawJson);
        } catch (error) {
            setToast({ message: "El archivo está corrupto o no es un JSON válido.", type: "error" });
            event.target.value = "";
            return;
        }

        // 2. Validación Estructural (Tu Tarea FE-7)
        // Verificamos que tenga la forma correcta (nodes, connections, ids)
        const validation = validateWorkflowImport(data);
        if (!validation.isValid) {
             setToast({ message: validation.error || "Estructura del workflow inválida.", type: "error" });
             event.target.value = "";
             return;
        }

        // 3. Procesamiento del Workflow (Lógica existente)
        const parsed = parseWorkflowImportJson(rawJson);

        if (!parsed.ok) {
          setToast({ message: parsed.error || "Error al importar el workflow.", type: "error" });
          event.target.value = "";
          return;
        }

        const snapshot = convertWorkflowToCanvasSnapshot(parsed.workflow);
        const storageKey = `workflow-canvas:${parsed.workflow.id}`;
        localStorage.removeItem(storageKey);
        localStorage.setItem(storageKey, JSON.stringify(snapshot));

        const formattedDate = formatDateEs();

        upsertWorkflow({
          id: parsed.workflow.id,
          name: parsed.workflow.name,
          description: `Importado desde JSON (${snapshot.nodes.length} nodos)`,
          status: "ACTIVE",
          date: formattedDate,
        });

        if (parsed.warning) {
           setToast({ message: parsed.warning, type: "warning" });
        } else {
           setToast({ message: "Workflow importado correctamente.", type: "success" });
        }

        const workflowRoute = `/workflows/${parsed.workflow.id}`;
        
        setTimeout(() => {
            if (pathname.startsWith(workflowRoute)) {
              window.location.reload();
            } else {
              router.push(workflowRoute);
            }
        }, 500);

      } catch (err) {
        setToast({ message: "Ocurrió un error inesperado al leer el archivo.", type: "error" });
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
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
      
      {/* 5. Renderizamos el Toast aquí */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}
