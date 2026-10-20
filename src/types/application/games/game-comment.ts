export type GameComment = {
  id: string;
  userId: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  body: string;
  createdAt: string;
};
