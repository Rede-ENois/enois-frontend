import { type FormEvent, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Bookmark, Flag, Heart, MessageSquare, Send, Share2 } from "lucide-react";

import {
  REACTION_EMOJIS,
  REPORT_REASONS,
  commentsApi,
  feedApi,
  profileApi,
  reactionsApi,
  reportsApi,
} from "@/lib/api";
import type { CommentView, PostView, ReactionType, ReportReason } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import { prependIfMissing, unique } from "@/utils/collections";
import {
  createReplyTarget,
  getParentAuthorName,
  getReplies,
  getRootComments,
} from "@/utils/comments";
import { humanizeEnum } from "@/utils/string";
import { formatRelativeTime } from "@/utils/time";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { MediaGrid } from "@/components/media-grid";
import { MentionTextarea } from "@/components/mention-textarea";
import { PostLinkPreviews } from "@/components/post-link-previews";
import { RichText } from "@/components/rich-text";
import { UserAvatar } from "@/components/user-avatar";

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

function ReactionsSummary({
  postId,
  reactionStatus,
}: {
  postId: string;
  reactionStatus: string | null;
}) {
  const { data } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    staleTime: 30_000,
  });

  const summary = data?.summary;
  if (!summary) return null;

  const entries = (Object.entries(summary) as [string, number][]).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map(([type, count]) => (
        <span
          key={type}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-light tabular-nums ${
            reactionStatus === type
              ? "bg-surface-2 text-primary"
              : "border border-border-soft text-text-subtle"
          }`}
        >
          {REACTION_EMOJIS[type] ?? type} {count}
        </span>
      ))}
    </div>
  );
}

function ReactionsDialog({
  postId,
  currentUserReaction,
  currentUserId,
  open,
  onOpenChange,
}: {
  postId: string;
  currentUserReaction: string | null;
  currentUserId?: string;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { data } = useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    enabled: open,
  });

  const apiReactions = data?.reactions ?? [];
  const optimisticReaction =
    currentUserReaction && currentUserId
      ? {
          userId: currentUserId,
          type: currentUserReaction,
          createdAt: new Date().toISOString(),
        }
      : null;
  const reactions = prependIfMissing(
    apiReactions,
    optimisticReaction,
    (reaction) => reaction.userId === currentUserId,
  );
  const uniqueUserIds = unique(reactions.map((reaction) => reaction.userId));

  const { data: users } = useQuery({
    queryKey: ["profiles", "by-ids", [...uniqueUserIds].sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueUserIds.map((id) => profileApi.getById(id).catch(() => null)),
      );
      return Object.fromEntries(results.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: open && uniqueUserIds.length > 0,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>
        {reactions.length === 0 ? (
          <p className="py-8 text-center text-[13px] font-light text-text-subtle">
            {texts.posts.reactions.empty}
          </p>
        ) : (
          <div className="space-y-2 pt-2">
            {reactions.map((reaction) => {
              const user = users?.[reaction.userId];
              return (
                <div
                  key={`${reaction.userId}-${reaction.type}`}
                  className="flex items-center gap-3 rounded-xl bg-surface-1 p-3"
                >
                  <UserAvatar src={user?.avatar} alt={user?.name} className="h-9 w-9 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-light text-text-strong">
                      {user?.name ?? texts.common.loading}
                    </p>
                  </div>
                  <span className="text-xl">{REACTION_EMOJIS[reaction.type] ?? reaction.type}</span>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [description, setDescription] = useState("");

  const submit = async () => {
    try {
      await reportsApi.create({
        targetId: postId,
        targetType: "POST",
        reason,
        description: description || undefined,
      });
      onOpenChange(false);
      setDescription("");
    } catch {
      // silently fail
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.report.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-light text-text-subtle">{texts.posts.report.reason}</Label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="flex h-10 w-full rounded-md border border-border-soft bg-muted px-3 py-2 text-[13px] font-light text-text-strong"
            >
              {REPORT_REASONS.map((reportReason) => (
                <option key={reportReason} value={reportReason}>
                  {humanizeEnum(reportReason)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-light text-text-subtle">
              {texts.posts.report.description}
            </Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="h-10 border-transparent bg-muted text-[13px] font-light"
            />
          </div>
          <Button className="w-full rounded-full" onClick={submit}>
            {texts.posts.report.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PostCard({ post }: { post: PostView }) {
  const { user: currentUser } = useAuth();
  const meta = typeMeta[post.type] ?? typeMeta.INSIGHT;
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentMentions, setCommentMentions] = useState<string[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<CommentView[]>([]);
  const [postCounters, setPostCounters] = useState(post.counters);
  const [reactionStatus, setReactionStatus] = useState<string | null>(
    post.currentUserReaction ?? null,
  );
  const [saved, setSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    setReactionStatus(post.currentUserReaction ?? null);
  }, [post.currentUserReaction]);

  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => feedApi.listSaved(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (savedData) setSaved(savedData.items.some((savedPost) => savedPost.id === post.id));
  }, [savedData, post.id]);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    try {
      const newComment = await commentsApi.create(
        post.id,
        content,
        replyToId,
        commentMentions,
      );
      setLocalComments((current) => [...current, newComment]);
      setPostCounters((counters) => ({ ...counters, comments: counters.comments + 1 }));
      setDraft("");
      setCommentMentions([]);
      setReplyToId(null);
    } catch {
      // silently fail
    }
  };

  const handleReaction = async (type: ReactionType) => {
    try {
      const removing = reactionStatus === type;
      const result = removing
        ? await reactionsApi.removeReaction(post.id)
        : await reactionsApi.react(post.id, type);
      setReactionStatus(removing ? null : type);
      if ("counters" in result && result.counters) setPostCounters(result.counters);
    } catch {
      // silently fail
    }
  };

  const handleSave = async () => {
    try {
      const result = saved
        ? await reactionsApi.removeSave(post.id)
        : await reactionsApi.save(post.id);
      setSaved((value) => !value);
      setPostCounters(result.counters);
    } catch {
      // silently fail
    }
  };

  const handleShare = async () => {
    try {
      const result = await reactionsApi.share(post.id);
      setPostCounters(result.counters);
      const url = `${window.location.origin}/feed/${post.id}`;
      const shareActions = {
        native: () => navigator.share({ url }),
        clipboard: () => navigator.clipboard.writeText(url),
      };
      await (navigator.share ? shareActions.native : shareActions.clipboard)();
    } catch {
      // silently fail
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.remove(post.id, commentId);
      setLocalComments((comments) => comments.filter((comment) => comment.id !== commentId));
      setPostCounters((counters) => ({ ...counters, comments: counters.comments - 1 }));
    } catch {
      // silently fail
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const data = await commentsApi.list(post.id);
        setLocalComments(data.items);
      } catch {
        // silently fail
      }
    }
    setShowComments((value) => !value);
  };

  const startReply = async (comment: CommentView) => {
    const target = await createReplyTarget(comment);
    setDraft(target.draft);
    setCommentMentions(target.mentionedUserIds);
    setReplyToId(target.replyToId);
  };

  const rootComments = getRootComments(localComments);

  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <header className="flex justify-between items-start gap-3">
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

      <ReactionsSummary postId={post.id} reactionStatus={reactionStatus} />
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
                      onClick={() => handleReaction(type)}
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
            onClick={() => setShowReactions(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums transition hover:bg-muted hover:text-foreground text-muted-foreground"
          >
            {postCounters.reactions}
          </button>
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" /> {postCounters.comments}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-4 w-4" /> {texts.posts.share}
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground text-muted-foreground"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
            saved ? "text-primary" : ""
          }`}
        >
          <Bookmark className="h-4 w-4" /> {postCounters.saves}
        </button>
      </footer>

      <ReactionsDialog
        postId={post.id}
        currentUserReaction={reactionStatus}
        currentUserId={currentUser?.id}
        open={showReactions}
        onOpenChange={setShowReactions}
      />
      <ReportDialog postId={post.id} open={showReport} onOpenChange={setShowReport} />

      {showComments && (
        <section className="mt-4 border-t border-border-soft pt-4">
          <div className="space-y-3">
            {rootComments.map((comment) => {
              const replies = getReplies(localComments, comment.id);
              return (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    currentUserId={currentUser?.id}
                    onDelete={handleDeleteComment}
                    onReply={startReply}
                  />
                  {replies.length > 0 && (
                    <div className="ml-10 mt-2 space-y-2 border-l-2 border-border-soft pl-4">
                      {replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          replyingTo={getParentAuthorName(localComments, reply.parentCommentId)}
                          currentUserId={currentUser?.id}
                          onDelete={handleDeleteComment}
                          onReply={startReply}
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

          <form onSubmit={submitComment} className="mt-4 flex items-center gap-2.5">
            <UserAvatar
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="h-8 w-8 shrink-0"
            />
            <div className="flex flex-1 items-center gap-2 rounded-full border border-border-soft bg-surface-1 py-1.5 pl-4 pr-1.5">
              <MentionTextarea
                value={draft}
                onChange={(value, ids) => {
                  setDraft(value);
                  setCommentMentions(ids);
                }}
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

function CommentItem({
  comment,
  replyingTo,
  currentUserId,
  onDelete,
  onReply,
}: {
  comment: CommentView;
  replyingTo?: string;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  onReply?: (comment: CommentView) => void;
}) {
  const isOwner = currentUserId === comment.authorId;
  const [commentReaction, setCommentReaction] = useState<string | null>(null);

  const handleCommentReaction = async (type: ReactionType) => {
    try {
      const removing = commentReaction === type;
      const actions = {
        remove: () => reactionsApi.removeCommentReaction(comment.postId, comment.id),
        add: () => reactionsApi.reactComment(comment.postId, comment.id, type),
      };
      await (removing ? actions.remove : actions.add)();
      setCommentReaction(removing ? null : type);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex gap-2.5">
      <UserAvatar
        src={comment.authorAvatar}
        alt={comment.authorName}
        className="h-8 w-8 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-surface-1 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-text-strong">{comment.authorName}</span>
            {replyingTo && (
              <span className="text-[11px] font-light text-text-subtle">
                {texts.posts.comments.replyingTo(replyingTo)}
              </span>
            )}
            <span className="text-[11px] font-light text-text-subtle">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 break-words text-[13px] font-light leading-relaxed text-text-strong">
            <RichText text={comment.content} />
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-3 text-[11px] font-light text-text-subtle">
          <button
            onClick={() => onReply?.(comment)}
            className="transition-colors hover:text-primary"
          >
            {texts.posts.comments.reply}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="transition-colors hover:text-primary">
                {commentReaction ? REACTION_EMOJIS[commentReaction] : texts.posts.reactions.react}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              className="w-fit rounded-2xl border-border-soft bg-surface-card p-1.5"
            >
              <div className="flex gap-1">
                {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
                  ([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => handleCommentReaction(type)}
                      className={`rounded-lg px-2 py-1 text-lg transition hover:bg-surface-2 ${
                        commentReaction === type ? "bg-surface-2 ring-1 ring-primary" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ),
                )}
              </div>
            </PopoverContent>
          </Popover>
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-destructive transition-colors hover:text-destructive/80"
            >
              {texts.posts.comments.delete}
            </button>
          )}
        </div>
      </div>
    </div>
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
            className="font-bold hover:underline text-[14px]"
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
