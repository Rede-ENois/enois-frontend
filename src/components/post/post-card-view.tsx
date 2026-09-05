import type { FormEventHandler, ReactNode } from "react";

import type { CommentView, PostView, Profile, ReactionType } from "@/lib/api";
import { texts } from "@/texts";

import { MediaGrid } from "@/components/media-grid";
import { PostLinkPreviews } from "@/components/post-link-previews";
import { AuthorInfo } from "@/components/post/post-author-info";
import { PostActions } from "@/components/post/post-actions";
import { PostComments } from "@/components/post/post-comments";
import { RichText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";

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

      <PostActions
        counters={counters}
        reactionStatus={reactionStatus}
        saved={saved}
        onReaction={onReaction}
        onOpenReactions={onOpenReactions}
        onToggleComments={onToggleComments}
        onShare={onShare}
        onReport={onReport}
        onSave={onSave}
      />

      {showComments && (
        <PostComments
          currentUser={currentUser}
          comments={comments}
          rootComments={rootComments}
          draft={draft}
          onDeleteComment={onDeleteComment}
          onReply={onReply}
          onDraftChange={onDraftChange}
          onSubmitComment={onSubmitComment}
        />
      )}
    </article>
  );
}
