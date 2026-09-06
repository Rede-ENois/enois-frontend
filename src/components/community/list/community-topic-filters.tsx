import { texts } from "@/texts";
import type { CommunityTopicFiltersProps } from "@/types/components/community/community-topic-filters-props";

import { CommunityTopicButton } from "./community-topic-button";
import { COMMUNITY_TOPICS } from "./community-topics";

export function CommunityTopicFilters({ selectedTopic, onChange }: CommunityTopicFiltersProps) {
  return <div className="flex flex-wrap gap-2"><CommunityTopicButton isActive={!selectedTopic} onClick={() => onChange(undefined)}>{texts.communities.topics.all}</CommunityTopicButton>{COMMUNITY_TOPICS.map((topic) => <CommunityTopicButton key={topic} isActive={topic === selectedTopic} onClick={() => onChange(topic)}>{texts.communities.topics[topic]}</CommunityTopicButton>)}</div>;
}
