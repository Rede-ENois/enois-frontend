import type { PostView } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

import { PostCardView } from "./post-card-view";
import { PostReportDialog } from "./post-report-dialog";
import { ReactionsDialog } from "./reactions-dialog";
import { ReactionsSummary } from "./reactions-summary";
import { usePostComments } from "./use-post-comments";
import { usePostInteractions } from "./use-post-interactions";

type PostCardProps = {
  post: PostView;
};

export function PostCard({ post }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const interactions = usePostInteractions(post);
  const comments = usePostComments(post.id, interactions.handleCommentCountChange);

  return (
    <>
      <PostCardView
        post={post}
        currentUser={currentUser}
        counters={interactions.counters}
        currentReaction={interactions.currentReaction}
        isSaved={interactions.isSaved}
        areCommentsVisible={comments.areCommentsVisible}
        comments={comments.comments}
        rootComments={comments.rootComments}
        commentContent={comments.commentContent}
        reactionSummary={
          <ReactionsSummary
            postId={post.id}
            currentReaction={interactions.currentReaction}
          />
        }
        onReaction={interactions.handleReaction}
        onOpenReactions={() => interactions.setIsReactionsDialogOpen(true)}
        onToggleComments={comments.handleToggleComments}
        onShare={interactions.handleShare}
        onReport={() => interactions.setIsReportDialogOpen(true)}
        onSave={interactions.handleSave}
        onDeleteComment={comments.handleDeleteComment}
        onReply={comments.handleReply}
        onCommentContentChange={comments.setCommentContent}
        onSubmitComment={comments.handleSubmitComment}
      />
      <ReactionsDialog
        postId={post.id}
        currentUserReaction={interactions.currentReaction}
        currentUserId={currentUser?.id}
        isOpen={interactions.isReactionsDialogOpen}
        onOpenChange={interactions.setIsReactionsDialogOpen}
      />
      <PostReportDialog
        postId={post.id}
        isOpen={interactions.isReportDialogOpen}
        onOpenChange={interactions.setIsReportDialogOpen}
      />
    </>
  );
}
