import type { WithRequiredChildren } from "@/types/components/with-required-children";

export function AppLayoutRoot({ children }: WithRequiredChildren) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
