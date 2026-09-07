import { COMMUNITY_TOPICS } from "@/constants/community-topics";
import type { CommunityTopic } from "@/types/application/community/community-topic";

export function createCommunityTopicOptions(
  topic: CommunityTopic | undefined,
  changeTopic: (topic: CommunityTopic | undefined) => void,
) {
  return COMMUNITY_TOPICS.map(({ value, label }) => ({
    value,
    label,
    selected: (value === "Todas" && !topic) || value === topic,
    select: () => changeTopic(value === "Todas" ? undefined : value),
  }));
}
