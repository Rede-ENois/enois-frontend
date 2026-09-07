import type { FeedTab } from "@/types/application/feed/feed-tab";

export type FeedTabsProps = {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
};
