import type { PostCardViewProps } from "@/types/components/post/post-card-view-props";

import { PostActions } from "./post-actions";
import { PostComments } from "./post-comments";
import { PostContent } from "./post-content";
import { PostHeader } from "./post-header";

export function PostCardView(props: PostCardViewProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <PostHeader post={props.post} />
      <PostContent post={props.post} reactionSummary={props.reactionSummary} />
      <PostActions
        counters={props.counters}
        currentReaction={props.currentReaction}
        isSaved={props.isSaved}
        onReaction={props.onReaction}
        onOpenReactions={props.onOpenReactions}
        onToggleComments={props.onToggleComments}
        onShare={props.onShare}
        onReport={props.onReport}
        onSave={props.onSave}
      />
      {props.areCommentsVisible && (
        <PostComments
          currentUser={props.currentUser}
          comments={props.comments}
          rootComments={props.rootComments}
          commentContent={props.commentContent}
          onDeleteComment={props.onDeleteComment}
          onReply={props.onReply}
          onCommentContentChange={props.onCommentContentChange}
          onSubmitComment={props.onSubmitComment}
        />
      )}
    </article>
  );
}
