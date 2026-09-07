import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { NewConversationSearchProps } from "@/types/components/messages/new-conversation-search-props";

import { createConversation as createConversationRequest } from "@/lib/api/messages/create-conversation";

export function useCreateDirectConversation(
  { onSelect, onClose }: NewConversationSearchProps,
  onCreated: () => void,
) {
  const queryClient = useQueryClient();
  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      createConversationRequest({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      onSelect(conversation.id);
      onClose();
      onCreated();
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return (participantId: string) => createConversation.mutate(participantId);
}
