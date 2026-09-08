import type { CommunityTopic } from "@/types/application/community/community-topic";

export type CommunityTopicOption = {
  value: CommunityTopic | "Todas";
  label: string;
  selected: boolean;
  select: () => void;
};
