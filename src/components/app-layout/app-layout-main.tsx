import type { PropsWithChildren } from "react";

export function AppLayoutMain({ children }: PropsWithChildren) {
  return <main className="min-w-0 flex-1">{children}</main>;
}
