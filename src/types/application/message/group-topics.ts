import type { GroupTopicData, GroupTopicError } from "@rede-enois/design-system/domain";

export type GroupTopics = {
  topics: GroupTopicData[];
  loading: boolean;
  pending: boolean;
  /** Texto do último erro de gestão, já traduzido (o DS mostra ao lado da ação). */
  error: string | null;
  onCreateTopic: (name: string) => Promise<GroupTopicError | null>;
  onRenameTopic: (topicId: string, name: string) => Promise<GroupTopicError | null>;
  onArchiveTopic: (topicId: string) => Promise<GroupTopicError | null>;
  onReorderTopics: (topicIds: string[]) => Promise<GroupTopicError | null>;
};
