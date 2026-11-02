import type { CommunityTopic } from "./community-topic";

export type CommunityListParams = {
  topic?: CommunityTopic;
  cursor?: string | null;
  limit?: number;
  q?: string;
  /** Cidade como a pessoa escreveu; o backend compara sem acento e exige `state` junto. */
  city?: string;
  /** Sigla da UF. */
  state?: string;
};
