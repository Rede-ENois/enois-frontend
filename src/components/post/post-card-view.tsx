import type { FormEventHandler, ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { Bookmark, Flag, Heart, MessageSquare, Send, Share2 } from "lucide-react";

import { REACTION_EMOJIS } from "@/lib/api";
import type { CommentView, PostView, Profile, ReactionType } from "@/lib/api";
import { texts } from "@/texts";
import { getParentAuthorName, getReplies } from "@/utils/comments";
import { formatRelativeTime } from "@/utils/time";

import { MediaGrid } from "@/components/media-grid";
import { MentionTextarea } from "@/components/mention-textarea";
import { PostLinkPreviews } from "@/components/post-link-previews";
import { PostCommentItem } from "@/components/post/post-comment-item";
import { RichText } from "@/components/rich-text";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const typeMeta: Record<
  PostView["type"],
  { label: string; className: string; classAvatar: string }
> = {
  INSIGHT: {
    label: texts.posts.types.insight,
    className: "bg-highlight-insight text-highlight-insight-text",
    classAvatar: "bg-user-insight text-highlight-insight-text",
  },
  QUESTION: {
    label: texts.posts.types.question,
    className: "bg-secondary/30 text-secondary-foreground",
    classAvatar: "",
  },
  PROJECT: {
    label: texts.posts.types.project,
    className: "bg-highlight-project text-highlight-project-text",
    classAvatar: "bg-user-project text-user-project-text",
  },
  OPPORTUNITY: {
    label: texts.posts.types.opportunity,
    className: "bg-opportunity/20 text-opportunity-foreground",
    classAvatar: "",
  },
  ARTICLE: {
    label: texts.posts.types.article,
    className: "bg-highlight-article text-highlight-article-text",
    classAvatar: "bg-user-article text-user-article-text",
  },
};

type PostCardViewProps = {
  post: PostView;
  currentUser: Profile | null | undefined;
  counters: PostView["counters"];
  reactionStatus: string | null;
  saved: boolean;
  showComments: boolean;
  comments: CommentView[];
  rootComments: CommentView[];
  draft: string;
  reactionSummary: ReactNode;
  onReaction: (type: ReactionType) => void;
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onSave: () => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (comment: CommentView) => void;
  onDraftChange: (value: string, mentionedUserIds: string[]) => void;
  onSubmitComment: FormEventHandler<HTMLFormElement>;
};

export function PostCardView({
  post,
  currentUser,
  counters,
  reactionStatus,
  saved,
  showComments,
  comments,
  rootComments,
  draft,
  reactionSummary,
  onReaction,
  onOpenReactions,
  onToggleComments,
  onShare,
  onReport,
  onSave,
  onDeleteComment,
  onReply,
  onDraftChange,
  onSubmitComment,
}: PostCardViewProps) {
  const meta = typeMeta[post.type] ?? typeMeta.INSIGHT;

  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <AuthorInfo
          authorUsername={post.authorUsername}
          authorName={post.authorName}
          authorAvatar={post.authorAvatar}
          createdAt={post.createdAt}
          fallbackClassName={meta.classAvatar}
        />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
      </header>

      <p className="mt-4 whitespace-pre-line break-words text-[15px] font-light leading-relaxed text-text-strong">
        <RichText text={post.content} />
      </p>

      {post.mediaIds.length > 0 && (
        <div className="mt-4">
          <MediaGrid mediaIds={post.mediaIds} />
        </div>
      )}

      {reactionSummary}
      <PostLinkPreviews content={post.content} />

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-full border border-border-soft bg-transparent font-light text-text-subtle"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

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

      {showComments && (
        <section className="mt-4 border-t border-border-soft pt-4">
          <div className="space-y-3">
            {rootComments.map((comment) => {
              const replies = getReplies(comments, comment.id);
              return (
                <div key={comment.id}>
                  <PostCommentItem
                    comment={comment}
                    currentUserId={currentUser?.id}
                    onDelete={onDeleteComment}
                    onReply={onReply}
                  />
                  {replies.length > 0 && (
                    <div className="ml-10 mt-2 space-y-2 border-l-2 border-border-soft pl-4">
                      {replies.map((reply) => (
                        <PostCommentItem
                          key={reply.id}
                          comment={reply}
                          replyingTo={getParentAuthorName(comments, reply.parentCommentId)}
                          currentUserId={currentUser?.id}
                          onDelete={onDeleteComment}
                          onReply={onReply}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {rootComments.length === 0 && (
              <p className="py-4 text-center text-[13px] font-light text-text-subtle">
                {texts.posts.comments.empty}
              </p>
            )}
          </div>

          <form onSubmit={onSubmitComment} className="mt-4 flex items-center gap-2.5">
            <UserAvatar
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="h-8 w-8 shrink-0"
            />
            <div className="flex flex-1 items-center gap-2 rounded-full border border-border-soft bg-surface-1 py-1.5 pl-4 pr-1.5">
              <MentionTextarea
                value={draft}
                onChange={onDraftChange}
                placeholder={texts.posts.comments.placeholder}
                className="h-6 min-h-6 flex-1 resize-none border-0 bg-transparent p-0 text-[13px] font-light outline-none"
                maxLength={280}
              />
              <Button
                type="submit"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full"
                disabled={!draft.trim()}
                aria-label={texts.posts.comments.send}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </section>
      )}
    </article>
  );
}

function AuthorInfo({
  authorUsername,
  authorName,
  authorAvatar,
  createdAt,
  fallbackClassName,
}: {
  authorUsername: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  fallbackClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Link to="/perfil/$username" params={{ username: authorUsername }}>
        <UserAvatar
          src={authorAvatar}
          alt={authorName}
          fallbackClassName={fallbackClassName}
          className="h-11 w-11"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link
            to="/perfil/$username"
            params={{ username: authorUsername }}
            className="text-[14px] font-bold hover:underline"
          >
            {authorName}
          </Link>
          <span className="text-[12px] font-light text-text-date">
            · {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
