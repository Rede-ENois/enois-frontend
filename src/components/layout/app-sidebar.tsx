import { useAppSidebarController } from "@/utils/layout/use-app-sidebar-controller";

import { cn } from "@/lib/utils";

import { NavigationLinks } from "@/components/navigation/navigation-links";

export function AppSidebar() {
  const { toggle, widthClassName, ToggleIcon, toggleLabel } = useAppSidebarController();

  return (
    <aside
      className={cn("sticky top-20 hidden h-fit shrink-0 lg:block", widthClassName)}
      style={{ transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div className="flex flex-col gap-1">
        <button
          onClick={toggle}
          className="mb-1 grid h-8 w-8 place-items-center self-end rounded-lg text-text-subtle transition hover:bg-surface-2 hover:text-primary"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <ToggleIcon className="h-4 w-4" />
        </button>

        <NavigationLinks variant="sidebar" />
      </div>
    </aside>
  );
}
