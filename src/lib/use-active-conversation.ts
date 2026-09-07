import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listConversations } from "@/lib/api/messages";
import { listMessages } from "@/lib/api/messages/list-messages";
import { sendMessage as sendMessageRequest } from "@/lib/api/messages/send-message";
import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import type { SendMessageInput } from "@/types/components/messages/send-message-input";

export function useActiveConversation(conversationId?: string | null) {
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
    refetchInterval: 15_000,
  });

  const conversations = conversationsData?.items ?? [];
  const activeConversation = conversationId
    ? conversations.find((conversation) => conversation.id === conversationId)
    : null;

  const { data: messagesData } = useQuery({
    queryKey: ["messages", activeConversation?.id],
    queryFn: () => listMessages(activeConversation!.id),
    enabled: !!activeConversation,
    refetchInterval: 10_000,
  });

  const messages = (messagesData?.items ?? []).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const activeMessages = activeConversation ? messages : [];

  const otherParticipantId = activeConversation?.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherParticipantId],
    queryFn: () => getProfileById(otherParticipantId ?? ""),
    enabled: !!otherParticipantId,
  });

  const sendMessage = useMutation({
    mutationFn: ({ conversationId: id, text }: SendMessageInput) => sendMessageRequest(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    currentUserId,
    activeConversation,
    activeMessages,
    otherParticipantId,
    otherUser,
    sendMessage,
  };
}
