import type { CommunityTopic } from "./community-topic";

export type CreateCommunityFormProps = {
  name: string;
  description: string;
  topic: CommunityTopic;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTopicChange: (value: CommunityTopic) => void;
  onSubmit: () => void;
};
