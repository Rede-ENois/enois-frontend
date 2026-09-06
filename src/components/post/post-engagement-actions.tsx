import { Flag, MessageSquare, Share2 } from "lucide-react";

import { texts } from "@/texts";
import type { PostEngagementActionsProps } from "@/types/components/post/post-engagement-actions-props";

export function PostEngagementActions({
  counters,
  onOpenReactions,
  onToggleComments,
  onShare,
  onReport,
}: PostEngagementActionsProps) {
  return (
    <>
      <button type="button" onClick={onOpenReactions} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums text-muted-foreground transition hover:bg-muted hover:text-foreground">
        {counters.reactions}
      </button>
      <button type="button" onClick={onToggleComments} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground">
        <MessageSquare className="h-4 w-4" /> {counters.comments}
      </button>
      <button type="button" onClick={onShare} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground">
        <Share2 className="h-4 w-4" /> {texts.posts.share}
      </button>
      <button type="button" onClick={onReport} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
        <Flag className="h-4 w-4" />
      </button>
    </>
  );
}
