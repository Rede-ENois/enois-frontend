import { usePostCardContext } from "@/utils/components/post/use-post-card-context";

import { PostCommentsProvider } from "@/components/post-comments-provider";
import { ReportDialog } from "@/components/post-report-dialog";
import { ReactionsDialog } from "@/components/reactions-dialog";

export function PostActionPanels() {
  const { post } = usePostCardContext();

  return (
    <>
      <ReactionsDialog postId={post.id} />
      <ReportDialog postId={post.id} />
      <PostCommentsProvider />
    </>
  );
}
