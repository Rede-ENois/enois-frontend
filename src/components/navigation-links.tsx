import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

import { navigationItems } from "./navigation-items";

type NavigationLinksProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export function NavigationLinks({
  collapsed = false,
  onNavigate,
  className,
}: NavigationLinksProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      data-collapsed={collapsed}
      className={cn("group/navigation flex flex-col gap-1", className)}
    >
      {navigationItems.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-[14px] font-light transition",
              "group-data-[collapsed=true]/navigation:justify-center group-data-[collapsed=true]/navigation:gap-0 group-data-[collapsed=true]/navigation:px-0",
              active
                ? "border-primary bg-surface-2 text-primary"
                : "border-transparent text-text-subtle hover:bg-surface-3 hover:text-text-strong",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors lg:h-4 lg:w-4",
                active && "text-primary",
              )}
            />
            <span className="whitespace-nowrap transition-all duration-300 group-data-[collapsed=true]/navigation:w-0 group-data-[collapsed=true]/navigation:overflow-hidden group-data-[collapsed=true]/navigation:opacity-0">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
