import { useQuery } from "@tanstack/react-query";

import type { Conversation } from "@/types/application/message/conversation";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";

export function useConversationParticipant(
  conversation: Conversation | null,
  currentUserId: string | null,
) {
  const otherParticipantId = conversation?.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherParticipantId],
    queryFn: () => getProfileById(otherParticipantId ?? ""),
    enabled: !!otherParticipantId,
  });

  return { otherParticipantId, otherUser };
}
