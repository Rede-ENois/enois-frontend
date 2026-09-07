import type { PostActionPanelsProps } from "@/types/components/post/post-action-panels-props";

import { PostComments } from "@/components/post-comments";
import { ReportDialog } from "@/components/post-report-dialog";
import { ReactionsDialog } from "@/components/reactions-dialog";

export function PostActionPanels({ postId, showComments }: PostActionPanelsProps) {
  return (
    <>
      <ReactionsDialog postId={postId} />
      <ReportDialog postId={postId} />
      <PostComments postId={postId} visible={showComments} />
    </>
  );
}
