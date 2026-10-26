import { useAppShellStore } from "@/stores/app-shell.store";
import { AuthenticatedAppHeader as AuthenticatedAppHeaderView } from "@rede-enois/design-system/domain";

import { getCurrentUser } from "@/lib/current-user";

import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";

import { GlobalSearch } from "./global-search";
import { NotificationsPopover } from "./notifications-popover";

/** Wires the design system header to the shell store, the session and its nested containers. */
export function AuthenticatedAppHeader() {
  const openMobileNavigation = useAppShellStore((state) => state.openMobileNavigation);
  const profile = getCurrentUser();

  return (
    <AuthenticatedAppHeaderView
      homeHref="/feed"
      onOpenNavigation={openMobileNavigation}
      search={<GlobalSearch />}
      actions={
        <>
          <ThemeToggle />
          <NotificationsPopover />
          {profile && <AccountMenu profile={profile} />}
        </>
      }
    />
  );
}
