import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useMessagesStore } from "@/stores/messages.store";

import { createConversation as createConversationRequest } from "@/lib/messages/api/create-conversation";

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();
  const selectConversation = useMessagesStore((state) => state.selectConversation);
  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      createConversationRequest({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      selectConversation(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return (participantId: string) => createConversation.mutate(participantId);
}
