import { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { MazeDirection } from "@/types/application/daily-games/maze-direction";
import { DailyMaze as DailyMazeView } from "@rede-enois/design-system/domain";

import { randomUUID } from "@/lib/api-client";
import { dailyMazeApi, previousChallengeDate } from "@/lib/api/daily-games";
import { dailyDateLabel, useDailyShare } from "@/lib/daily-share";

export function DailyMaze() {
  const client = useQueryClient();
  const [showPrevious, setShowPrevious] = useState(false);
  const pending = useRef<{ direction: MazeDirection; requestId: string } | null>(null);

  const today = useQuery({
    queryKey: ["daily-games", "maze", "today"],
    queryFn: () => dailyMazeApi.today(),
  });
  const previousDate = today.data ? previousChallengeDate(today.data.date) : undefined;
  const previous = useQuery({
    queryKey: ["daily-games", "maze", "previous", previousDate],
    queryFn: () => dailyMazeApi.today(previousDate),
    enabled: Boolean(previousDate),
  });
  const ranking = useQuery({
    queryKey: ["daily-games", "maze", "leaderboard"],
    queryFn: dailyMazeApi.leaderboard,
  });
  const state = showPrevious ? previous.data : today.data;

  const start = useMutation({
    mutationFn: dailyMazeApi.start,
    onSuccess: (data) => {
      client.setQueryData(["daily-games", "maze", "today"], data);
    },
    onError: () => {
      void today.refetch();
    },
  });

  const move = useMutation({
    mutationFn: ({
      direction,
      requestId,
      date,
    }: {
      direction: MazeDirection;
      requestId: string;
      date?: string;
    }) => dailyMazeApi.move(direction, requestId, date),
    onSuccess: (data, { date }) => {
      pending.current = null;
      client.setQueryData(
        date ? ["daily-games", "maze", "previous", date] : ["daily-games", "maze", "today"],
        data,
      );
      if (data.status === "WON")
        void client.invalidateQueries({ queryKey: ["daily-games", "maze", "leaderboard"] });
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ["daily-games", "maze"] });
    },
  });

  function attempt(direction: MazeDirection) {
    if ((showPrevious ? previous.data : today.data)?.status !== "IN_PROGRESS" || move.isPending)
      return;
    if (!pending.current || pending.current.direction !== direction)
      pending.current = { direction, requestId: randomUUID() };
    move.mutate({ ...pending.current, date: showPrevious ? previousDate : undefined });
  }

  const dailyShare = useDailyShare();
  const share = () => {
    if (state?.status !== "WON") return;
    const elapsed =
      state.startedAt && state.completedAt
        ? Date.parse(state.completedAt) - Date.parse(state.startedAt)
        : 0;
    void dailyShare.share({
      game: "maze",
      dateLabel: dailyDateLabel(state.date),
      moves: state.moves,
      elapsedMillis: Math.max(0, elapsed),
    });
  };

  return (
    <DailyMazeView
      loading={today.isPending}
      loadError={today.isError}
      onRetryLoad={() => void today.refetch()}
      canTogglePrevious={previous.data?.status === "IN_PROGRESS" || showPrevious}
      showPrevious={showPrevious}
      onTogglePrevious={() => {
        pending.current = null;
        setShowPrevious(!showPrevious);
      }}
      state={state}
      onStart={() => start.mutate()}
      startPending={start.isPending}
      startError={start.isError}
      movePending={move.isPending}
      moveFailed={move.isError}
      moveErrorMessage={move.error instanceof Error ? move.error.message : null}
      onMove={attempt}
      onShare={share}
      shareStatus={dailyShare.status}
      ranking={{
        loading: ranking.isPending,
        error: ranking.isError,
        onRetry: () => void ranking.refetch(),
        items: ranking.data?.items.map((item) => ({ ...item, href: `/perfil/${item.username}` })),
      }}
    />
  );
}
