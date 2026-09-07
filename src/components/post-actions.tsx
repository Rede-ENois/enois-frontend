import { texts } from "@/texts";
import type { PostCardProps } from "@/types/components/post/post-card-props";
import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";
import { Bookmark, Flag, Heart, MessageSquare, Share2 } from "lucide-react";

import { usePostActionsController } from "@/utils/components/post/use-post-actions-controller";

import { PopoverContent } from "@/components/ui/popover-content";

import { PostComments } from "@/components/post-comments";
import { ReportDialog } from "@/components/post-report-dialog";
import { ReactionsDialog } from "@/components/reactions-dialog";

export function PostActions({ post }: PostCardProps) {
  const {
    postCounters,
    reactionActive,
    reactionEmoji,
    reactionTitle,
    reactionOptions,
    openReactions,
    showComments,
    toggleComments,
    sharePost,
    openReport,
    saved,
    toggleSave,
  } = usePostActionsController({ post });

  return (
    <>
      <footer className="mt-4 flex justify-between flex-wrap items-center gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <div className="flex">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
                  reactionActive ? "text-primary" : ""
                }`}
                title={reactionTitle}
              >
                {reactionEmoji ? (
                  <span className="text-base leading-none">{reactionEmoji}</span>
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
                {reactionOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={option.react}
                    className={`rounded-lg px-2 py-1 text-xl transition hover:bg-muted ${
                      option.selected ? "bg-muted ring-1 ring-primary" : ""
                    }`}
                    title={option.title}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={openReactions}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums transition hover:bg-muted hover:text-foreground text-muted-foreground"
          >
            {postCounters.reactions}
          </button>

          <button
            onClick={toggleComments}
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
            onClick={openReport}
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
