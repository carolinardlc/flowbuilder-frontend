"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkflows } from "../context/WorkflowsContext"

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Workflows", href: "/workflows" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
  const pathname = usePathname();

  const { importWorkflows } = useWorkflows();

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!Array.isArray(data)) {
          alert("Formato inválido");
          return;
        }

        console.log("Data importada:", data);
        importWorkflows(data);
      } catch {
        alert("Archivo inválido");
      }
    };

    reader.readAsText(file);
  };


  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
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
              className={`nav-link ${
                isActive(item.href) ? "nav-link-active" : ""
              }`}
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
