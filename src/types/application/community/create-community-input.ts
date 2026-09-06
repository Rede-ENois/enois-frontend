export type CreateCommunityInput = {
  name: string;
  description: string;
  topic: string;
  cover?: string | null;
  avatar?: string | null;
};
