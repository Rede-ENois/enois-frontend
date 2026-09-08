export type ProfileRecommendationStore = {
  open: boolean;
  targetUserId: string | null;
  comment: string;
  openForUser: (userId: string) => void;
  close: () => void;
  setComment: (comment: string) => void;
};
