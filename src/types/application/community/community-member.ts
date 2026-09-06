export type CommunityMember = {
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  role: "ADMIN" | "MEMBER";
};
