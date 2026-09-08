import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

export type CreateCommunityFormProps = {
  form: CreateCommunityInput;
  setField: <K extends keyof CreateCommunityInput>(
    field: K,
    value: CreateCommunityInput[K],
  ) => void;
  setTopic: (value: string) => void;
  topicOptions: readonly {
    value: CommunityTopic;
    label: string;
  }[];
  createPending: boolean;
  createDisabled: boolean;
  createCommunity: () => void;
};
