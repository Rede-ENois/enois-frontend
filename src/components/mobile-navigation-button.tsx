import { texts } from "@/texts";
import { useMobileNavigationButtonController } from "@/utils/components/app/use-mobile-navigation-button-controller";
import { Menu } from "lucide-react";

export function MobileNavigationButton() {
  const { openMobileNavigation } = useMobileNavigationButtonController();

  return (
    <button
      onClick={openMobileNavigation}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary md:hidden"
      aria-label={texts.navigation.openMenu}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
