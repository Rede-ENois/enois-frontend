export const COMMUNITY_TOPICS = [
  "TECNOLOGIA",
  "ENGENHARIA",
  "DESIGN",
  "PRODUTO",
  "LIDERANCA",
  "CARREIRA",
  "FREELANCE",
] as const;

export type CommunityTopic = (typeof COMMUNITY_TOPICS)[number];
