import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { GameAnalyticsCard as GameAnalyticsCardView } from "@rede-enois/design-system/domain";

import { gamesApi } from "@/lib/api";

/** Os números de uso do jogo, só para o criador: a janela escolhida busca a série do servidor. */
export function GameAnalyticsCard({ gameId }: { gameId: string }) {
  const [days, setDays] = useState<number>(30);

  const analytics = useQuery({
    queryKey: ["games", "analytics", gameId, days],
    queryFn: () => gamesApi.analytics(gameId, days),
  });

  return (
    <GameAnalyticsCardView
      days={days}
      onDaysChange={setDays}
      data={analytics.data}
      loading={analytics.isLoading}
      error={analytics.isError}
    />
  );
}
