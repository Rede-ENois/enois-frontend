import type { Notification } from "@/lib/api";
import { NotificationItem } from "./notification-item";
export function NotificationsList({ notifications, emptyMessage, onMarkAsRead, onAcceptConnection }: { notifications: Notification[]; emptyMessage: string; onMarkAsRead: (id: string) => void; onAcceptConnection: (actorId: string) => void }) {
  return <div className="max-h-[28rem] overflow-y-auto">{notifications.length === 0 ? <p className="px-4 py-8 text-center text-[13px] font-light text-text-subtle">{emptyMessage}</p> : notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} onAcceptConnection={onAcceptConnection} />)}</div>;
}
