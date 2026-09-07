import { COMMUNITY_TOPICS } from "@/constants/community-topics";

export const CREATE_COMMUNITY_TOPIC_OPTIONS = COMMUNITY_TOPICS.filter(
  ({ value }) => value !== "Todas",
);
