import { useCallback } from "react";

import { type InfiniteData, type QueryClient, useQueryClient } from "@tanstack/react-query";

import type { PageResponse } from "@/types/application/api/page-response";
import type { Notification } from "@/types/application/notification/notification";
import type { UnreadSummary } from "@/types/application/notification/unread-summary";

import { notificationsApi } from "@/lib/api";

function markPage(page: PageResponse<Notification>, isTarget: (n: Notification) => boolean) {
  return {
    ...page,
    items: page.items.map((item) => (isTarget(item) ? { ...item, read: true } : item)),
  };
}

function isSummary(data: unknown): data is UnreadSummary {
  return typeof data === "object" && data !== null && "byModule" in data;
}

/**
 * Marks notifications read in every cached list (the bell's page and the full page) before the
 * server answers. The row dims the moment it is opened, even when the person leaves the page
 * right away; the invalidation after the request settles brings back the server truth (and the
 * summary behind the menu signals).
 */
export function markReadInCache(queryClient: QueryClient, id: string | "all") {
  const isTarget = (notification: Notification) => id === "all" || notification.id === id;

  queryClient.setQueriesData<
    PageResponse<Notification> | InfiniteData<PageResponse<Notification>> | UnreadSummary
  >({ queryKey: ["notifications"] }, (data) => {
    if (!data || isSummary(data)) return data;
    if ("pages" in data)
      return { ...data, pages: data.pages.map((page) => markPage(page, isTarget)) };
    if ("items" in data) return markPage(data, isTarget);
    return data;
  });
}

/**
 * Marks read the notification a tapped push points at (the worker passes its id along). A failure
 * is left alone on purpose: the notice simply stays unread in the bell, nothing is lost.
 */
export function useMarkPushRead() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string | null) => {
      if (!id) return;
      markReadInCache(queryClient, id);
      void notificationsApi
        .markAsRead(id)
        .catch(() => undefined)
        .finally(() => void queryClient.invalidateQueries({ queryKey: ["notifications"] }));
    },
    [queryClient],
  );
}
