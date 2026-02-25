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
  { label: "Configuracion", href: "/configuracion" },
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
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isBackendEditEnabled, setIsBackendEditEnabled] = useState(false);
  const [backendUrl, setBackendUrl] = useState("192.168.56.1");
  const [backendPort, setBackendPort] = useState("3000");

  const loadBackendConfig = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("backend-config");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ url: string; port: string }>;
      if (typeof parsed.url === "string" && parsed.url.trim()) {
        setBackendUrl(parsed.url);
      }
      if (typeof parsed.port === "string" && parsed.port.trim()) {
        setBackendPort(parsed.port);
      }
    } catch {
      return;
    }
  };

  const saveBackendConfig = () => {
    if (typeof window === "undefined") return;
    const url = backendUrl.trim() || "192.168.56.1";
    const port = backendPort.trim() || "3000";
    setBackendUrl(url);
    setBackendPort(port);
    try {
      localStorage.setItem("backend-config", JSON.stringify({ url, port }));
    } catch {
      return;
    }
  };

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
            {navItems.map((item) => {
              if (item.label === "Configuracion") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="nav-link"
                    onClick={() => {
                      loadBackendConfig();
                      setIsBackendEditEnabled(false);
                      setIsConfigOpen(true);
                    }}
                  >
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
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

      {isConfigOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="workflows-title">Configuracion</h2>
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label
                className="form-label"
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span>Editar</span>
                <button
                  type="button"
                  onClick={() =>
                    setIsBackendEditEnabled((prev) => {
                      const next = !prev;
                      if (!next) {
                        setBackendUrl("192.168.56.1");
                        setBackendPort("8080");
                      }
                      return next;
                    })
                  }
                  aria-pressed={isBackendEditEnabled}
                  className={`btn-secondary ${isBackendEditEnabled ? "" : ""}`}
                  style={{
                    padding: "6px 10px",
                    fontSize: "12px",
                    opacity: 1,
                  }}
                >
                  {isBackendEditEnabled ? "ON" : "OFF"}
                </button>
              </label>
            </div>
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">IP</label>
              <input
                className="form-input"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="192.168.56.1"
                disabled={!isBackendEditEnabled}
                style={{
                  opacity: isBackendEditEnabled ? 1 : 0.55,
                  cursor: isBackendEditEnabled ? "text" : "not-allowed",
                }}
              />
            </div>
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">PORT</label>
              <input
                className="form-input"
                value={backendPort}
                onChange={(e) => setBackendPort(e.target.value)}
                placeholder="3000"
                inputMode="numeric"
                disabled={!isBackendEditEnabled}
                style={{
                  opacity: isBackendEditEnabled ? 1 : 0.55,
                  cursor: isBackendEditEnabled ? "text" : "not-allowed",
                }}
              />
            </div>
            <div className="form-actions" style={{ marginTop: "16px" }}>
              <button
                className="btn-secondary"
                onClick={() => setIsConfigOpen(false)}
              >
                Cerrar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  saveBackendConfig();
                  setIsConfigOpen(false);
                  setToast({
                    message: "Configuracion guardada.",
                    type: "success",
                  });
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
