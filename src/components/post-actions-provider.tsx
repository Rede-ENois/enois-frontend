import { PostActionsContext } from "@/utils/components/post/post-actions-context";
import { usePostActionsController } from "@/utils/components/post/use-post-actions-controller";
import { usePostCardContext } from "@/utils/components/post/use-post-card-context";

import { PostActions } from "@/components/post-actions";

export function PostActionsProvider() {
  const { post } = usePostCardContext();
  const controller = usePostActionsController(post);

  return (
    <PostActionsContext.Provider value={controller}>
      <PostActions />
    </PostActionsContext.Provider>
  );
}
