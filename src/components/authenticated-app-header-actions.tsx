import type { AuthenticatedAppHeaderActionsProps } from "@/types/components/app/authenticated-app-header-actions-props";

import { NotificationsPopover } from "@/components/notifications-popover";
import { ThemeToggle } from "@/components/theme-toggle";

import { AuthenticatedAppProfileLink } from "@/components/authenticated-app-profile-link";

export function AuthenticatedAppHeaderActions({
  profile,
  showProfile,
}: AuthenticatedAppHeaderActionsProps) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ThemeToggle />
      <NotificationsPopover />
      {showProfile && profile && <AuthenticatedAppProfileLink profile={profile} />}
    </div>
  );
}
