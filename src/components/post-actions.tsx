import { useState } from "react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { PostCardProps } from "@/types/components/post/post-card-props";
import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";
import { Bookmark, Flag, Heart, MessageSquare, Share2 } from "lucide-react";

import { usePostReaction } from "@/lib/use-post-reaction";
import { usePostSave } from "@/lib/use-post-save";
import { usePostShare } from "@/lib/use-post-share";

import { PopoverContent } from "@/components/ui/popover-content";

import { PostComments } from "@/components/post-comments";
import { ReportDialog } from "@/components/post-report-dialog";
import { ReactionsDialog } from "@/components/reactions-dialog";

export function PostActions({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const card = usePostCardStore((state) => state.cards[post.id]);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const setShowReport = usePostCardStore((state) => state.setShowReport);
  const postCounters = card?.postCounters ?? post.counters;
  const { reactionStatus, reactToPost } = usePostReaction(post);
  const { saved, toggleSave } = usePostSave(post.id);
  const sharePost = usePostShare(post.id);

  return (
    <>
      <footer className="mt-4 flex justify-between flex-wrap items-center gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <div className="flex">
          <Popover>
            <PopoverTrigger asChild>
              <button
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
                      onClick={() => reactToPost(type)}
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
            onClick={() => setShowReactions(post.id, true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums transition hover:bg-muted hover:text-foreground text-muted-foreground"
          >
            {postCounters.reactions}
          </button>

          <button
            onClick={() => setShowComments((visible) => !visible)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />

            <>{postCounters.comments}</>
          </button>

          <button
            onClick={sharePost}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />

            <>{texts.posts.share}</>
          </button>

          <button
            onClick={() => setShowReport(post.id, true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground text-muted-foreground"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={toggleSave}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
            saved ? "text-primary" : ""
          }`}
        >
          <Bookmark className="h-4 w-4" />

          <>{postCounters.saves}</>
        </button>
      </footer>

      <ReactionsDialog postId={post.id} />
      <ReportDialog postId={post.id} />
      <PostComments postId={post.id} visible={showComments} />
    </>
  );
}
