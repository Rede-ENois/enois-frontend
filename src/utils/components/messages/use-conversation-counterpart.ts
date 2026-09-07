import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ConversationItemProps } from "@/types/components/messages/conversation-item-props";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useConversationCounterpart(conversation: ConversationItemProps["conversation"]) {
  const currentUserId = getCurrentUserId();
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => getProfileById(otherId ?? ""),
    enabled: Boolean(otherId),
  });

  return {
    otherId,
    otherUser,
    title: conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback,
    profileUsername: otherUser?.username ?? otherId ?? "",
  };
}
