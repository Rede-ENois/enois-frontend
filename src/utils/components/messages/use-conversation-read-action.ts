import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markConversationAsRead } from "@/lib/messages/api/mark-conversation-as-read";

export function useConversationReadAction() {
  const queryClient = useQueryClient();
  const markAsRead = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  return (conversationId: string) => markAsRead.mutate(conversationId);
}
