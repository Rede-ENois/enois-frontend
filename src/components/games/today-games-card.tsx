import { useQuery } from "@tanstack/react-query";

import { TodayGamesCard as TodayGamesCardView } from "@rede-enois/design-system/domain";

import { gamesApi } from "@/lib/api";

/** "Jogados hoje" no painel lateral do feed: as últimas 24 horas contadas pelo servidor. */
export function TodayGamesCard({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["games", "trending", "today"],
    queryFn: () => gamesApi.trendingToday(5),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <TodayGamesCardView
      loading={!enabled || isLoading}
      games={(data ?? []).map((game) => ({
        ...game,
        href: `/games/${game.username ?? ""}/${game.slug}`,
      }))}
    />
  );
}
