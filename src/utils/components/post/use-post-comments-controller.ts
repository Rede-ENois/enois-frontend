import { createPostCommentThreads } from "@/utils/components/post/create-post-comment-threads";
import { usePostCommentsLoader } from "@/utils/components/post/use-post-comments-loader";
import { usePostCommentsStore } from "@/utils/components/post/use-post-comments-store";

export function usePostCommentsController(postId: string, visible: boolean) {
  const state = usePostCommentsStore(postId);
  const loaded = usePostCommentsLoader(postId, visible, state.replaceComments);
  const { roots, threads } = createPostCommentThreads(state.comments);

  return {
    showComments: visible && loaded,
    showEmptyState: roots.length === 0,
    threads,
  };
}
