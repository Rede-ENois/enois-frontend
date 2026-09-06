import type { AppLayoutSlotProps } from "@/types/components/app/app-layout-slot-props";

export function AppLayoutContent({ children }: AppLayoutSlotProps) {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:pb-6">
      {children}
    </div>
  );
}
