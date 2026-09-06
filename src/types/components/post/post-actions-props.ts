import type { PostView } from "@/lib/api";

import type { ReactionActionProps } from "./reaction-action-props";

export type PostActionsProps = ReactionActionProps & {
  counters: PostView["counters"];
  isSaved: boolean;
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onSave: () => void;
};
