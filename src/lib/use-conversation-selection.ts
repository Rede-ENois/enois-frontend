import { useQuery } from "@tanstack/react-query";

import { listConversations } from "@/lib/api/messages";

export function useConversationSelection(conversationId?: string | null) {
  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
    refetchInterval: 15_000,
  });

  if (!conversationId) return null;
  return (data?.items ?? []).find((conversation) => conversation.id === conversationId) ?? null;
}
