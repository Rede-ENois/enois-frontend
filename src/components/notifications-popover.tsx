import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Bell, CheckCheck } from "lucide-react";

import { networkApi } from "@/lib/api/network";
import { notificationsApi } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import { texts } from "@/texts";
import type { NotificationTab } from "@/types/components/notification/notification-tab";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { NotificationItem } from "./notification-item";

export function NotificationsPopover() {
  const queryClient = useQueryClient();
  const [notificationTab, setNotificationTab] = useState<NotificationTab>("novas");

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const acceptConnection = useMutation({
    mutationFn: (actorId: string) => networkApi.accept(actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network"] });
    },
  });

  const notificationList = notificationsData?.items ?? [];
  const unreadCount = notificationList.filter((notification) => !notification.read).length;
  const displayedNotifications = notificationList.filter((notification) =>
    notificationTab === "novas" ? !notification.read : notification.read,
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative grid h-10 w-10 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
          aria-label={unreadCount > 0 ? texts.notifications.unreadLabel(unreadCount) : texts.notifications.title}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-medium leading-none text-primary-foreground">
              {unreadCount > 9 ? texts.notifications.overflowCount : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border-border-soft bg-surface-card p-0 shadow-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
          <span className="text-[14px] font-light text-text-strong">{texts.notifications.title}</span>
          {unreadCount > 0 && notificationTab === "novas" && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-light text-text-subtle transition hover:text-primary"
            >
              <CheckCheck className="h-3 w-3" />
              <>{texts.notifications.markAllRead}</>
            </button>
          )}
        </div>

        <div className="flex border-b border-border-soft">
          <button
            type="button"
            onClick={() => setNotificationTab("novas")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-light transition",
              notificationTab === "novas"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            <>{texts.notifications.tabs.new}</>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setNotificationTab("historico")}
            className={cn(
              "flex-1 py-2.5 text-[12px] font-light transition",
              notificationTab === "historico"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            {texts.notifications.tabs.history}
          </button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {displayedNotifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] font-light text-text-subtle">
              {notificationTab === "novas" ? texts.notifications.emptyNew : texts.notifications.emptyHistory}
            </p>
          ) : (
            displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={(id) => markAsRead.mutate(id)}
                onAcceptConnection={(actorId) => acceptConnection.mutate(actorId)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
