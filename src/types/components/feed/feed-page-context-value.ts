import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { PostView } from "@/types/application/feed/post-view";

export type FeedPageContextValue = {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  posts: PostView[];
  showLoading: boolean;
  showPosts: boolean;
};
