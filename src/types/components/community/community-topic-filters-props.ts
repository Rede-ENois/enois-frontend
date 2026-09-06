import type { CommunityTopic } from "./community-topic";

export type CommunityTopicFiltersProps = {
  selectedTopic: string | undefined;
  onChange: (topic?: CommunityTopic) => void;
};
