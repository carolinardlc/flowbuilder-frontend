"use client";

import type { ReactNode } from "react";
import { WorkflowsProvider } from "./WorkflowsContext";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return <WorkflowsProvider>{children}</WorkflowsProvider>;
}
