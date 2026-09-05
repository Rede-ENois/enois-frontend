import { Bookmark, Flag, Heart, MessageSquare, Share2 } from "lucide-react";

import { REACTION_EMOJIS } from "@/lib/api";
import type { PostView, ReactionType } from "@/lib/api";
import { texts } from "@/texts";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type PostActionsProps = {
  counters: PostView["counters"];
  reactionStatus: string | null;
  saved: boolean;
  onReaction: (type: ReactionType) => void;
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onSave: () => void;
};

export function PostActions({
  counters,
  reactionStatus,
  saved,
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
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
                reactionStatus ? "text-primary" : ""
              }`}
              title={
                reactionStatus
                  ? texts.posts.reactions.reactedWith(REACTION_EMOJIS[reactionStatus])
                  : texts.posts.reactions.react
              }
            >
              {reactionStatus ? (
                <span className="text-base leading-none">{REACTION_EMOJIS[reactionStatus]}</span>
              ) : (
                <Heart className="h-4 w-4" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            className="w-fit rounded-2xl border-border p-1.5"
          >
            <div className="flex gap-1">
              {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
                ([type, emoji]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onReaction(type)}
                    className={`rounded-lg px-2 py-1 text-xl transition hover:bg-muted ${
                      reactionStatus === type ? "bg-muted ring-1 ring-primary" : ""
                    }`}
                    title={type.toLowerCase()}
                  >
                    {emoji}
                  </button>
                ),
              )}
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={onOpenReactions}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {counters.reactions}
        </button>
        <button
          type="button"
          onClick={onToggleComments}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" /> {counters.comments}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
        >
          <Share2 className="h-4 w-4" /> {texts.posts.share}
        </button>
        <button
          type="button"
          onClick={onReport}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onSave}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
          saved ? "text-primary" : ""
        }`}
      >
        <Bookmark className="h-4 w-4" /> {counters.saves}
      </button>
    </footer>
  );
}
