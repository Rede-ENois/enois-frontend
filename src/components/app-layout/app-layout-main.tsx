import type { ReactNode } from "react";

export function AppLayoutMain({ children }: { children: ReactNode }) {
  return <main className="min-w-0 flex-1">{children}</main>;
}
