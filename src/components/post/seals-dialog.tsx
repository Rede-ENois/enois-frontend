import { useQueries, useQuery } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import { SealsDialog as SealsDialogView } from "@rede-enois/design-system/domain";

import { sealsApi } from "@/lib/api";
import { profileQueries } from "@/lib/query-options/profiles";

/** Quem marcou o post, com o selo de cada um — o mesmo caminho do diálogo de quem reagiu. */
export function SealsDialog({ postId }: PostIdProps) {
  const open = usePostCardStore((state) => state.cards[postId]?.showSeals ?? false);
  const setShowSeals = usePostCardStore((state) => state.setShowSeals);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["seals-people", postId],
    queryFn: () => sealsApi.people(postId),
    enabled: open,
  });

  const people = data?.people ?? [];
  const userIds = [...new Set(people.map((person) => person.userId))].sort();
  const profiles = useQueries({
    queries: userIds.map((id) => ({
      ...profileQueries.byId(id),
      enabled: open,
      retry: false,
    })),
  });
  const users = Object.fromEntries(
    profiles.flatMap((query) => (query.data ? [[query.data.id, query.data]] : [])),
  );

  return (
    <SealsDialogView
      open={open}
      onOpenChange={(nextOpen) => setShowSeals(postId, nextOpen)}
      people={people}
      summary={data?.seals ?? []}
      users={users}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
