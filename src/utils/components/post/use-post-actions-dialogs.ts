import { usePostCardStore } from "@/stores/post-card.store";

export function usePostActionsDialogs(postId: string) {
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const setShowReport = usePostCardStore((state) => state.setShowReport);

  return {
    openReactions: () => setShowReactions(postId, true),
    openReport: () => setShowReport(postId, true),
  };
}
