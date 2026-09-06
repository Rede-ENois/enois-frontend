import type { WithRequiredChildren } from "@/types/components/with-required-children";

export function AppLayoutContent({ children }: WithRequiredChildren) {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:pb-6">
      {children}
    </div>
  );
}
