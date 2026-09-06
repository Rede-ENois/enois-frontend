import type { AppLayoutSlotProps } from "@/types/components/app/app-layout-slot-props";

export function AppLayoutMain({ children }: AppLayoutSlotProps) {
  return <main className="min-w-0 flex-1">{children}</main>;
}
