export type JobAuthor = {
  id: string;
  username: string | null;
  name: string;
  avatar: string | null;
  headline: string | null;
  reputation: number;
  identityVerified: boolean;
};
