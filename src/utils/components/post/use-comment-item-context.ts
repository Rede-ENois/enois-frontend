import { useContext } from "react";

import { CommentItemContext } from "@/utils/components/post/comment-item-context";

export function useCommentItemContext() {
  const context = useContext(CommentItemContext);

  if (!context) {
    throw new Error("Comment item components must be rendered inside CommentItemProvider");
  }

  return context;
}
