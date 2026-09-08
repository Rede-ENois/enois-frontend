import { AuthenticatedAppProfileLink } from "@/components/authenticated-app-profile-link";
import { NotificationsPopoverProvider } from "@/components/notifications/notifications-popover-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthenticatedAppHeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ThemeToggle />
      <NotificationsPopoverProvider />
      <AuthenticatedAppProfileLink />
    </div>
  );
}
