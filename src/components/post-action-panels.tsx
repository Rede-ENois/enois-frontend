import { usePostActionsContext } from "@/utils/components/post/use-post-actions-context";
import { usePostCardContext } from "@/utils/components/post/use-post-card-context";

import { PostComments } from "@/components/post-comments";
import { ReportDialog } from "@/components/post-report-dialog";
import { ReactionsDialog } from "@/components/reactions-dialog";

export function PostActionPanels() {
  const { post } = usePostCardContext();
  const { showComments } = usePostActionsContext();

  return (
    <>
      <ReactionsDialog postId={post.id} />
      <ReportDialog postId={post.id} />
      <PostComments postId={post.id} visible={showComments} />
    </>
  );
}
