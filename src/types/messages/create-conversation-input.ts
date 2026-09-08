import type { Conversation } from "./conversation";

export type CreateConversationInput = {
  kind: Conversation["kind"];
  title?: string | null;
  participantIds: string[];
};
