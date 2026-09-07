import { usePostCardStore } from "@/stores/post-card.store";

export function useReactionsDialogState(postId: string) {
  const open = usePostCardStore((state) => state.cards[postId]?.showReactions ?? false);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);

  return {
    open,
    setOpen: (nextOpen: boolean) => setShowReactions(postId, nextOpen),
  };
}
