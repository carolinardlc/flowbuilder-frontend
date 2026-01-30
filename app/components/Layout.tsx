import type { ReactNode } from "react";
import Header from "./Header";

type LayoutProps = {
  children: ReactNode;
  fullWidth?: boolean;
};

export default function Layout({ children, fullWidth = false }: LayoutProps) {
  return (
    <div className="app-shell">
      <Header />
      <main className={`app-main ${fullWidth ? "app-main--wide" : ""}`}>
        <section className={`app-card ${fullWidth ? "app-card--wide" : ""}`}>
          {children}
        </section>
      </main>
    </div>
  );
}
