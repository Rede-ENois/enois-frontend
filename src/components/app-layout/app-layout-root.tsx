import type { ReactNode } from "react";

export function AppLayoutRoot({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
