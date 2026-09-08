import { AuthenticatedAppProfileLink } from "@/components/authenticated-app-profile-link";
import { NotificationsPopover } from "@/components/notifications-popover";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthenticatedAppHeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ThemeToggle />
      <NotificationsPopover />
      <AuthenticatedAppProfileLink />
    </div>
  );
}
