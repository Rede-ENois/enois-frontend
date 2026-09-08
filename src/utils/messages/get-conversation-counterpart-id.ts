import type { Conversation } from "@/types/messages/conversation";

export function getConversationCounterpartId(
  conversation: Conversation | null,
  currentUserId: string | null,
) {
  return conversation?.participantIds.find((id) => id !== currentUserId);
}
