import type { ReactNode } from "react";
import Header from "./Header";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <section className="app-card">{children}</section>
      </main>
    </div>
  );
}
