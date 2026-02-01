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
        {fullWidth ? (
          <div className="app-full-bleed">{children}</div>
        ) : (
          <section className="app-card">{children}</section>
        )}
      </main>
    </div>
  );
}
