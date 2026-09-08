import { PostCommentsContext } from "@/utils/components/post/post-comments-context";
import { usePostActionsContext } from "@/utils/components/post/use-post-actions-context";
import { usePostCardContext } from "@/utils/components/post/use-post-card-context";
import { usePostCommentsController } from "@/utils/components/post/use-post-comments-controller";

import { PostComments } from "@/components/post-comments";

export function PostCommentsProvider() {
  const { post } = usePostCardContext();
  const { showComments } = usePostActionsContext();
  const controller = usePostCommentsController(post.id, showComments);

  return (
    <PostCommentsContext.Provider value={{ postId: post.id, ...controller }}>
      <PostComments />
    </PostCommentsContext.Provider>
  );
}
