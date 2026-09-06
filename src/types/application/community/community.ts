export type Community = {
  id: string;
  name: string;
  description: string;
  topic: string;
  members: number;
  joined: boolean;
  cover: string | null;
  avatar: string | null;
};

export type CreateCommunityInput = Pick<Community, "name" | "description" | "topic"> &
  Partial<Pick<Community, "cover" | "avatar">>;
