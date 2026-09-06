import type { Notification } from "@/lib/api";

export type NotificationTab = "new" | "history";

export type NotificationTabConfig = {
  label: string;
  emptyMessage: string;
  matches: (notification: Notification) => boolean;
};
