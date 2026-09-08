import { Link } from "@tanstack/react-router";

import type { NavigationLinksProps } from "@/types/components/navigation/navigation-links-props";
import { useNavigationLinksController } from "@/utils/components/navigation/use-navigation-links-controller";

import { cn } from "@/lib/utils";

export function NavigationLinks({ variant, className }: NavigationLinksProps) {
  const { collapsed, items, handleNavigate } = useNavigationLinksController(variant);

  return (
    <nav
      data-collapsed={collapsed}
      className={cn("group/navigation flex flex-col gap-1", className)}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={handleNavigate}
            title={item.title}
            className={cn(
              "flex items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-[14px] font-light transition",
              "group-data-[collapsed=true]/navigation:justify-center group-data-[collapsed=true]/navigation:gap-0 group-data-[collapsed=true]/navigation:px-0",
              item.active
                ? "border-primary bg-surface-2 text-primary"
                : "border-transparent text-text-subtle hover:bg-surface-3 hover:text-text-strong",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors lg:h-4 lg:w-4",
                item.active && "text-primary",
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
