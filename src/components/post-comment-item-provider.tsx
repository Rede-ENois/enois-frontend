import type { CommentItemProviderProps } from "@/types/components/post/comment-item-provider-props";
import { CommentItemContext } from "@/utils/components/post/comment-item-context";
import { useCommentItemController } from "@/utils/components/post/use-comment-item-controller";

import { CommentItem } from "@/components/post-comment-item";

export function CommentItemProvider({ comment, replyingTo }: CommentItemProviderProps) {
  const controller = useCommentItemController(comment, replyingTo);

  return (
    <CommentItemContext.Provider value={{ comment, ...controller }}>
      <CommentItem />
    </CommentItemContext.Provider>
  );
}
