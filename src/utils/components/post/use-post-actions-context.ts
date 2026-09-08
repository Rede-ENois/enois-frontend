import { useContext } from "react";

import { PostActionsContext } from "@/utils/components/post/post-actions-context";

export function usePostActionsContext() {
  const context = useContext(PostActionsContext);

  if (!context) {
    throw new Error("Post action components must be rendered inside PostActionsProvider");
  }

  return context;
}
