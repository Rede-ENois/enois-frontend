import { texts } from "@/texts";

import { CommunityTopicButton } from "./community-topic-button";
import { COMMUNITY_TOPICS, type CommunityTopic } from "./community-topics";

type CommunityTopicFiltersProps = {
  selectedTopic: string | undefined;
  onChange: (topic?: CommunityTopic) => void;
};

export function CommunityTopicFilters({ selectedTopic, onChange }: CommunityTopicFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <CommunityTopicButton isActive={!selectedTopic} onClick={() => onChange(undefined)}>
        {texts.communities.topics.all}
      </CommunityTopicButton>
      {COMMUNITY_TOPICS.map((topic) => (
        <CommunityTopicButton
          key={topic}
          isActive={topic === selectedTopic}
          onClick={() => onChange(topic)}
        >
          {texts.communities.topics[topic]}
        </CommunityTopicButton>
      ))}
    </div>
  );
}
