import { useQuery } from "@tanstack/react-query";

import { listReactions } from "@/lib/api/reactions/list-reactions";

export function useReactionsSummary(postId: string) {
  const { data } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => listReactions(postId),
    staleTime: 30_000,
  });

  return data?.summary;
}
