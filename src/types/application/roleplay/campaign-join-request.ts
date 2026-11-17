export type CampaignJoinRequest = {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  message: string | null;
  createdAt: string;
};
