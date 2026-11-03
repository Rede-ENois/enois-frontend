import type { UnreadSummary } from "@/types/application/notification/unread-summary";

/** What lights the menu signals: notices per area, unread messages and pending requests. */
export type NavigationCounts = {
  summary: UnreadSummary | undefined;
  unreadMessages: number;
  pendingRequests: number;
  /** Modules turned off in personalization: their notices stay out of the panel, so out of the count. */
  disabledModules: ReadonlySet<string>;
};
