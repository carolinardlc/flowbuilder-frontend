"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useWorkflows } from "../context/WorkflowsContext";
import {
  persistImportedWorkflowSnapshot,
  processWorkflowImport,
} from "../services/workflowImport";
import Toast from "./Toast";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Workflows", href: "/workflows" },
  { label: "Contacto", href: "/contacto" },
];

type ToastState = {
  message: string;
  type: "success" | "error" | "warning";
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { upsertWorkflow } = useWorkflows();
  const [toast, setToast] = useState<ToastState | null>(null);

  const navigateToImportedWorkflow = (workflowRoute: string) => {
    setTimeout(() => {
      if (pathname.startsWith(workflowRoute)) {
        window.location.reload();
        return;
      }
      router.push(workflowRoute);
    }, 500);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawJson = await file.text();
      const result = processWorkflowImport(rawJson);

      if (!result.ok) {
        setToast({ message: result.error, type: "error" });
        return;
      }

      persistImportedWorkflowSnapshot(result.workflowId, result.snapshot);
      upsertWorkflow(result.workflowRecord);

      setToast({
        message: result.warning || "Workflow importado correctamente.",
        type: result.warning ? "warning" : "success",
      });

      navigateToImportedWorkflow(result.route);
    } catch {
      setToast({
        message: "Ocurrio un error inesperado al leer el archivo.",
        type: "error",
      });
    } finally {
      event.target.value = "";
    }
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
