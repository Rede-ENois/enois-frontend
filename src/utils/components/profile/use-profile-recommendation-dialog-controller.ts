import { useProfileRecommendationStore } from "@/stores/profile-recommendation.store";

export function useProfileRecommendationDialogController(userId: string) {
  const open = useProfileRecommendationStore(
    (state) => state.open && state.targetUserId === userId,
  );
  const openForUser = useProfileRecommendationStore((state) => state.openForUser);
  const close = useProfileRecommendationStore((state) => state.close);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      openForUser(userId);
      return;
    }

    close();
  };

  return {
    open,
    handleOpenChange,
  };
}
