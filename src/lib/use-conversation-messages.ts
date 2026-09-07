import { useQuery } from "@tanstack/react-query";

import { listMessages } from "@/lib/api/messages/list-messages";

export function useConversationMessages(conversationId?: string) {
  const { data } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => listMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 10_000,
  });

  return [...(data?.items ?? [])].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
}
