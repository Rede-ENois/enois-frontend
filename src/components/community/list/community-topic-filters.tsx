import { texts } from "@/texts";

import { CommunityTopicButton } from "./community-topic-button";
import { COMMUNITY_TOPICS, type CommunityTopic } from "./community-topics";

export function CommunityTopicFilters({
  selected,
  onChange,
}: {
  selected: string | undefined;
  onChange: (topic?: CommunityTopic) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <CommunityTopicButton active={!selected} onClick={() => onChange(undefined)}>
        {texts.communities.topics.all}
      </CommunityTopicButton>
      {COMMUNITY_TOPICS.map((topic) => (
        <CommunityTopicButton key={topic} active={topic === selected} onClick={() => onChange(topic)}>
          {texts.communities.topics[topic]}
        </CommunityTopicButton>
      ))}
    </div>
  );
}
