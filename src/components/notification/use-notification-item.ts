import { useNavigate } from "@tanstack/react-router";
import type { Notification } from "@/lib/api";
import { texts } from "@/texts";
import { navigateToHref } from "@/utils/navigation";
import { notificationMeta } from "./notification-meta";
export function useNotificationItem(notification: Notification, onMarkAsRead: (id: string) => void, onAcceptConnection: (actorId: string) => void) {
  const navigate = useNavigate();
  const kind = notification.kind.toLowerCase();
  const meta = notificationMeta[kind] ?? notificationMeta.connection;
  const markAsRead = () => !notification.read && onMarkAsRead(notification.id);
  const handleNavigate = () => { markAsRead(); navigateToHref(notification.href, navigate); };
  const handleAcceptConnection = () => { if (!notification.actorId) return; markAsRead(); onAcceptConnection(notification.actorId); };
  const cta = kind === "connection_request" && notification.actorId ? { label: notification.ctaLabel || texts.notifications.accept, onClick: handleAcceptConnection } : notification.ctaLabel ? { label: notification.ctaLabel, onClick: handleNavigate } : null;
  return { meta, Icon: meta.icon, markAsRead, handleNavigate, cta };
}
