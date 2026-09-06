import type { PostView } from "@/lib/api";

export type PostEngagementActionsProps = {
  counters: PostView["counters"];
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
};
