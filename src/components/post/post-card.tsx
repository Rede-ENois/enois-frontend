import type { PostView } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

import { PostCardView } from "./post-card-view";
import { PostReportDialog } from "./post-report-dialog";
import { ReactionsDialog } from "./reactions-dialog";
import { ReactionsSummary } from "./reactions-summary";
import { usePostComments } from "./use-post-comments";
import { usePostInteractions } from "./use-post-interactions";

export function PostCard({ post }: { post: PostView }) {
  const { user: currentUser } = useAuth();
  const interactions = usePostInteractions(post);
  const comments = usePostComments(post.id, interactions.changeCommentCount);

  return (
    <>
      <PostCardView
        post={post}
        currentUser={currentUser}
        counters={interactions.counters}
        reactionStatus={interactions.reactionStatus}
        saved={interactions.saved}
        showComments={comments.showComments}
        comments={comments.comments}
        rootComments={comments.rootComments}
        draft={comments.draft}
        reactionSummary={<ReactionsSummary postId={post.id} reactionStatus={interactions.reactionStatus} />}
        onReaction={interactions.react}
        onOpenReactions={() => interactions.setShowReactions(true)}
        onToggleComments={comments.toggleComments}
        onShare={interactions.share}
        onReport={() => interactions.setShowReport(true)}
        onSave={interactions.save}
        onDeleteComment={comments.deleteComment}
        onReply={comments.startReply}
        onDraftChange={comments.setDraft}
        onSubmitComment={comments.submitComment}
      />
      <ReactionsDialog
        postId={post.id}
        currentUserReaction={interactions.reactionStatus}
        currentUserId={currentUser?.id}
        open={interactions.showReactions}
        onOpenChange={interactions.setShowReactions}
      />
      <PostReportDialog postId={post.id} open={interactions.showReport} onOpenChange={interactions.setShowReport} />
    </>
  );
}
