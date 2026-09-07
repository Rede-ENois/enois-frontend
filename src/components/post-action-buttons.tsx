import { Bookmark, Flag, MessageSquare, Share2 } from "lucide-react";

import { texts } from "@/texts";
import type { PostActionButtonsProps } from "@/types/components/post/post-action-buttons-props";

export function PostActionButtons({
  comments,
  saves,
  saved,
  onToggleComments,
  onShare,
  onReport,
  onToggleSave,
}: PostActionButtonsProps) {
  return (
    <>
      <div className="flex">
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />

          <>{comments}</>
        </button>

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />

          <>{texts.posts.share}</>
        </button>

        <button
          onClick={onReport}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={onToggleSave}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
          saved ? "text-primary" : ""
        }`}
      >
        <Bookmark className="h-4 w-4" />

        <>{saves}</>
      </button>
    </>
  );
}
