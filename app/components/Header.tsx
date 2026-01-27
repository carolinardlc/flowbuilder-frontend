import Link from "next/link";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Workflows", href: "/workflows" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand-title">
          <span className="brand-pill">FlowBuilder</span>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
