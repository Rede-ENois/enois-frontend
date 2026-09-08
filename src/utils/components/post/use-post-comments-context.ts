import { useContext } from "react";

import { PostCommentsContext } from "@/utils/components/post/post-comments-context";

export function usePostCommentsContext() {
  const context = useContext(PostCommentsContext);

  if (!context) {
    throw new Error("Post comment components must be rendered inside PostCommentsProvider");
  }

  return context;
}
