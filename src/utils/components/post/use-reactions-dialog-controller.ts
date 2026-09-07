import { createReactionsDialogItems } from "@/utils/components/post/create-reactions-dialog-items";
import { useReactionsDialogData } from "@/utils/components/post/use-reactions-dialog-data";
import { useReactionsDialogState } from "@/utils/components/post/use-reactions-dialog-state";

export function useReactionsDialogController(postId: string) {
  const dialog = useReactionsDialogState(postId);
  const data = useReactionsDialogData(postId, dialog.open);

  return {
    ...dialog,
    showEmptyState: data.reactions.length === 0,
    items: createReactionsDialogItems(data.reactions, data.users),
  };
}
