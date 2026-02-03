import type { ReactNode } from "react";
import Header from "./Header";

type LayoutProps = {
  children: ReactNode;
  fullWidth?: boolean;
  hideHeader?: boolean;
};

export default function Layout({ children, fullWidth = false, hideHeader = false }: LayoutProps) {
  return (
    <div className="app-shell">
      {!hideHeader && <Header />}
      <main className={`app-main ${fullWidth ? "app-main--wide" : ""} ${hideHeader ? "app-main--no-header" : ""}`}>
        <section className={`app-card ${fullWidth ? "app-card--wide" : ""}`}>
          {children}
        </section>
      </main>
    </div>
  );
}
