export type CampaignMember = {
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  role: "GAME_MASTER" | "PLAYER";
  joinedAt: string;
};
