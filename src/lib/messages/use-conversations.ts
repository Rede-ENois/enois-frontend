import { useQuery } from "@tanstack/react-query";

import { listConversations } from "@/lib/messages/api/messages";

export function useConversations() {
  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
    refetchInterval: 15_000,
  });

  return data?.items ?? [];
}
