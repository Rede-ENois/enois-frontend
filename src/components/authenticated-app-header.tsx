import { useAppShellStore } from "@/stores/app-shell.store";
import { texts } from "@/texts";
import { Menu } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";

import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";

import { AppBrand } from "./app-brand";
import { AppHeaderLayout } from "./app-header-layout";
import { GlobalSearch } from "./global-search";
import { NotificationsPopover } from "./notifications-popover";

export function AuthenticatedAppHeader() {
  const openMobileNavigation = useAppShellStore((state) => state.openMobileNavigation);
  const profile = getCurrentUser();

  return (
    <AppHeaderLayout>
      <button
        onClick={openMobileNavigation}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary md:hidden"
        aria-label={texts.navigation.openMenu}
        title={texts.navigation.openMenu}
      >
        <Menu className="h-5 w-5" />
      </button>

      <AppBrand />
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <NotificationsPopover />
        {profile && <AccountMenu profile={profile} />}
      </div>
    </AppHeaderLayout>
  );
}
