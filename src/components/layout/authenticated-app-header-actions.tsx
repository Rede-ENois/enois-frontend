import { NotificationsPopoverProvider } from "@/components/notifications/notifications-popover-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthenticatedAppProfileLink } from "@/components/layout/authenticated-app-profile-link";

export function AuthenticatedAppHeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ThemeToggle />
      <NotificationsPopoverProvider />
      <AuthenticatedAppProfileLink />
    </div>
  );
}
