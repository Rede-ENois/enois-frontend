import type { PostActionsProps } from "@/types/components/post/post-actions-props";

import { PostEngagementActions } from "./post-engagement-actions";
import { PostReactionAction } from "./post-reaction-action";
import { PostSaveAction } from "./post-save-action";

export function PostActions({
  counters,
  currentReaction,
  isSaved,
  onReaction,
  onOpenReactions,
  onToggleComments,
  onShare,
  onReport,
  onSave,
}: PostActionsProps) {
  return (
    <footer className="mt-4 flex flex-wrap items-center justify-between gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
      <div className="flex">
        <PostReactionAction currentReaction={currentReaction} onReaction={onReaction} />
        <PostEngagementActions
          counters={counters}
          onOpenReactions={onOpenReactions}
          onToggleComments={onToggleComments}
          onShare={onShare}
          onReport={onReport}
        />
      </div>
      <PostSaveAction isSaved={isSaved} saves={counters.saves} onSave={onSave} />
    </footer>
  );
}
