import type { AppLayoutSlotProps } from "@/types/components/app/app-layout-slot-props";

export function AppLayoutRoot({ children }: AppLayoutSlotProps) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
