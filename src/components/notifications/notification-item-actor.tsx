import { useNotificationItemContext } from "@/utils/notifications/use-notification-item-context";

import { cn } from "@/lib/utils";

export function NotificationItemActor() {
  const { notification, Icon, iconClassName, navigate } = useNotificationItemContext();

  return (
    <button
      type="button"
      onClick={navigate}
      className="shrink-0 rounded-full transition hover:opacity-80"
    >
      {notification.actorAvatar ? (
        <img
          src={notification.actorAvatar}
          alt={notification.actorName ?? ""}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <span className={cn("grid h-9 w-9 place-items-center rounded-full", iconClassName)}>
          <Icon className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}
