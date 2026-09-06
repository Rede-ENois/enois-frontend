import type { PostView } from "@/types/application/feed/post-view";

export type PostEngagementActionsProps = {
  counters: PostView["counters"];
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
};
