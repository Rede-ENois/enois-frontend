import { useContext } from "react";

import { ReactionsDialogContext } from "@/utils/components/post/reactions-dialog-context";

export function useReactionsDialogContext() {
  const context = useContext(ReactionsDialogContext);

  if (!context) {
    throw new Error("Reactions dialog components must be rendered inside ReactionsDialogProvider");
  }

  return context;
}
