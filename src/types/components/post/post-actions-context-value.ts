import type { PostView } from "@/types/application/feed/post-view";
import type { PostReactionOption } from "@/types/components/post/post-reaction-option";

export type PostActionsContextValue = {
  postCounters: PostView["counters"];
  reactionActive: boolean;
  reactionEmoji: string | null;
  reactionTitle: string;
  reactionOptions: PostReactionOption[];
  openReactions: () => void;
  showComments: boolean;
  toggleComments: () => void;
  openReport: () => void;
  sharePost: () => void;
  saved: boolean;
  toggleSave: () => void;
};
