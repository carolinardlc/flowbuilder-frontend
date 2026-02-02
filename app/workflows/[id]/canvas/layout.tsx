// This segment-level layout imports ReactFlow's global CSS only for the canvas route.
// Keeping it here avoids polluting the entire app with ReactFlow's base styles.

import type { ReactNode } from "react";
import "reactflow/dist/style.css";

type CanvasLayoutProps = {
  children: ReactNode;
};

// The layout is intentionally transparent; it simply scopes the CSS import.
export default function CanvasLayout({ children }: CanvasLayoutProps) {
  return <>{children}</>;
}
