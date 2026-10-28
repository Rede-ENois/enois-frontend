import { useEffect, useState } from "react";

import { useAppShellStore } from "@/stores/app-shell.store";
import { AuthenticatedAppHeader as AuthenticatedAppHeaderView } from "@rede-enois/design-system/domain";

import { useCurrentUser } from "@/lib/current-user";

import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";

import { GlobalSearch } from "./global-search";
import { NotificationsPopover } from "./notifications-popover";

/** Wires the design system header to the shell store, the session and its nested containers. */
export function AuthenticatedAppHeader() {
  const openMobileNavigation = useAppShellStore((state) => state.openMobileNavigation);
  // Subscribed, so the menu shows up when /me arrives. It waits for mount because the server never
  // has the user: a parent route can fill the cache before this header hydrates, and drawing the
  // menu on that first render breaks hydration (seen on /comunidades/$id and /vagas/$id).
  const { data: profile } = useCurrentUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AuthenticatedAppHeaderView
      homeHref="/feed"
      onOpenNavigation={openMobileNavigation}
      search={<GlobalSearch />}
      actions={
        <>
          <ThemeToggle />
          <NotificationsPopover />
          {mounted && profile && <AccountMenu profile={profile} />}
        </>
      }
    />
  );
}
