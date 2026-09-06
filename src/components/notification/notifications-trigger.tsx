import { Bell } from "lucide-react";

import { texts } from "@/texts";
import { getNotificationBadge } from "@/utils/notifications";

type NotificationsTriggerProps = {
  unreadCount: number;
};

export function NotificationsTrigger({ unreadCount }: NotificationsTriggerProps) {
  return <button className="relative grid h-10 w-10 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary" aria-label={unreadCount > 0 ? texts.notifications.unreadLabel(unreadCount) : texts.notifications.title}><Bell className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-medium leading-none text-primary-foreground">{getNotificationBadge(unreadCount)}</span>}</button>;
}
