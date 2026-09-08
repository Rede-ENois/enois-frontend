import type { AuthenticatedAppHeaderActionsProps } from "@/types/components/app/authenticated-app-header-actions-props";

import { AuthenticatedAppProfileLink } from "@/components/authenticated-app-profile-link";
import { NotificationsPopover } from "@/components/notifications-popover";
import { ThemeToggle } from "@/components/theme-toggle";

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
