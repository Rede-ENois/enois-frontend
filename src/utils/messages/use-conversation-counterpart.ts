import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Conversation } from "@/types/messages/conversation";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useConversationCounterpart(
  conversation: Pick<Conversation, "title" | "participantIds"> | null,
) {
  const currentUserId = getCurrentUserId();
  const otherId = conversation?.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => getProfileById(otherId ?? ""),
    enabled: Boolean(otherId),
  });

  return {
    otherId,
    otherUser,
    title: conversation?.title ?? otherUser?.name ?? texts.messages.conversationFallback,
    profileUsername: otherUser?.username ?? otherId ?? "",
  };
}
