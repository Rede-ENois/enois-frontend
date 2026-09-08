import { texts } from "@/texts";
import type { MobileNavigationButtonProps } from "@/types/components/app/mobile-navigation-button-props";
import { Menu } from "lucide-react";

export function MobileNavigationButton({ onClick }: MobileNavigationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary md:hidden"
      aria-label={texts.navigation.openMenu}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
