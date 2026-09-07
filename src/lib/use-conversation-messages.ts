import { useQuery } from "@tanstack/react-query";

import { listMessages } from "@/lib/api/messages/list-messages";
import { sortConversationMessages } from "@/utils/messages/sort-conversation-messages";

export function useConversationMessages(conversationId?: string) {
  const { data } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => listMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 10_000,
  });

  return sortConversationMessages(data?.items ?? []);
}
