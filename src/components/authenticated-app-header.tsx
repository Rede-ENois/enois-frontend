import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Menu } from "lucide-react";

import { profileApi } from "@/lib/api";
import { texts } from "@/texts";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";

import { AppBrand } from "./app-brand";
import { AppHeaderLayout } from "./app-header-layout";
import { GlobalSearch } from "./global-search/global-search";
import { NotificationsPopover } from "./notification/notifications-popover";

type AuthenticatedAppHeaderProps = {
  onOpenMobileMenu: () => void;
};

export function AuthenticatedAppHeader({ onOpenMobileMenu }: AuthenticatedAppHeaderProps) {
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: () => profileApi.getCurrent(),
  });

  return (
    <AppHeaderLayout>
      <button
        onClick={onOpenMobileMenu}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary md:hidden"
        aria-label={texts.navigation.openMenu}
      >
        <Menu className="h-5 w-5" />
      </button>

      <AppBrand />
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <NotificationsPopover />
        {profile && (
          <Link
            to="/perfil/$username"
            params={{ username: profile.username }}
            className="flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-surface-2"
          >
            <UserAvatar src={profile.avatar} alt={profile.name} className="h-8 w-8" />
            <span className="hidden text-[13px] font-light text-text-strong sm:inline">{texts.common.profile}</span>
          </Link>
        )}
      </div>
    </AppHeaderLayout>
  );
}
