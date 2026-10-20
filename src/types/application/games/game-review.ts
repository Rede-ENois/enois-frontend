export type GameReview = {
  id: string;
  userId: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};
