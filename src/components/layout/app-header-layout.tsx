import type { WithRequiredChildren } from "@/types/components/with-required-children";

export function AppHeaderLayout({ children }: WithRequiredChildren) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        {children}
      </div>
    </header>
  );
}
