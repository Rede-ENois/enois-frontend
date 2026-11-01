import type { PostView } from "@/types/application/feed/post-view";
import type { HomeTab } from "@/types/routes/feed/home-tab";

export interface VirtualizedFeedListProps {
  posts: PostView[];
  feedTab: HomeTab;
  caughtUpAt: number | null;
  firstPostRef: (element: HTMLElement | null) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  loadingLabel: string;
  endLabel?: string;
}
