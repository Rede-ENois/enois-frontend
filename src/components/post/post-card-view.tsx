import { PostActions } from "./post-actions";
import { PostComments } from "./post-comments";
import { PostContent } from "./post-content";
import { PostHeader } from "./post-header";
import type { PostCardViewProps } from "./post-card-view.types";

export function PostCardView(props: PostCardViewProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <PostHeader post={props.post} />
      <PostContent post={props.post} reactionSummary={props.reactionSummary} />
      <PostActions
        counters={props.counters}
        reactionStatus={props.reactionStatus}
        saved={props.saved}
        onReaction={props.onReaction}
        onOpenReactions={props.onOpenReactions}
        onToggleComments={props.onToggleComments}
        onShare={props.onShare}
        onReport={props.onReport}
        onSave={props.onSave}
      />
      {props.showComments && (
        <PostComments
          currentUser={props.currentUser}
          comments={props.comments}
          rootComments={props.rootComments}
          draft={props.draft}
          onDeleteComment={props.onDeleteComment}
          onReply={props.onReply}
          onDraftChange={props.onDraftChange}
          onSubmitComment={props.onSubmitComment}
        />
      )}
    </article>
  );
}
