import type { CommunityTopic } from "@/types/components/community/community-topic";

export const COMMUNITY_TOPICS = [
  "TECNOLOGIA",
  "ENGENHARIA",
  "DESIGN",
  "PRODUTO",
  "LIDERANCA",
  "CARREIRA",
  "FREELANCE",
] as const satisfies readonly CommunityTopic[];
