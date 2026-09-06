import type { PropsWithChildren } from "react";

export function AppLayoutRoot({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
