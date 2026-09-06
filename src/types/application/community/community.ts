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
