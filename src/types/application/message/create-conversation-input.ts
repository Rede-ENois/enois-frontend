export type CreateConversationInput = {
  kind: "DIRECT" | "GROUP";
  title?: string | null;
  participantIds: string[];
};
