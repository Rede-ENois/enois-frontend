import { useContext } from "react";

import { PostCardContext } from "@/utils/components/post/post-card-context";

export function usePostCardContext() {
  const context = useContext(PostCardContext);

  if (!context) {
    throw new Error("Post card components must be rendered inside PostCardProvider");
  }

  return context;
}
