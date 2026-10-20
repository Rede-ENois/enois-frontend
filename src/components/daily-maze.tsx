import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import type { MazeDirection } from "@/types/application/daily-games/maze-direction";
import { Clock, Flag, Map, Trophy } from "lucide-react";

import { randomUUID } from "@/lib/api-client";
import { dailyMazeApi, previousChallengeDate } from "@/lib/api/daily-games";

import { Button } from "@/components/ui/button";

const keys: Record<string, MazeDirection> = {
  ArrowUp: "UP",
  ArrowRight: "RIGHT",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
};
const buttons: { direction: MazeDirection; label: string; symbol: string }[] = [
  { direction: "UP", label: "Mover para cima", symbol: "↑" },
  { direction: "LEFT", label: "Mover para a esquerda", symbol: "←" },
  { direction: "DOWN", label: "Mover para baixo", symbol: "↓" },
  { direction: "RIGHT", label: "Mover para a direita", symbol: "→" },
];

export function DailyMaze() {
  const client = useQueryClient();
  const [showPrevious, setShowPrevious] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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
  const queryKey = showPrevious
    ? ["daily-games", "maze", "previous", previousDate]
    : ["daily-games", "maze", "today"];
  const ranking = useQuery({
    queryKey: ["daily-games", "maze", "leaderboard"],
    queryFn: dailyMazeApi.leaderboard,
  });
  const state = showPrevious ? previous.data : today.data;

  // Atualiza rastro de passos do labirinto
  useEffect(() => {
    if (state?.position !== undefined) {
      setVisited((prev) => new Set([...prev, state.position]));
    }
  }, [state?.position]);

  // Reseta rastro quando o desafio for reiniciado
  useEffect(() => {
    if (state?.status === "NOT_STARTED") {
      setVisited(new Set([0]));
    }
  }, [state?.status, state?.date]);

  // Cronômetro ao vivo durante a partida
  useEffect(() => {
    if (!state || state.status !== "IN_PROGRESS" || !state.startedAt) return;
    const startMs = new Date(state.startedAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [state?.status, state?.startedAt]);

  function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const start = useMutation({
    mutationFn: dailyMazeApi.start,
    onSuccess: (data) => {
      setVisited(new Set([0]));
      client.setQueryData(queryKey, data);
    },
    onError: () => {
      void today.refetch();
    },
  });

  const move = useMutation({
    mutationFn: ({ direction, requestId }: { direction: MazeDirection; requestId: string }) =>
      dailyMazeApi.move(direction, requestId, showPrevious ? previousDate : undefined),
    onSuccess: (data) => {
      pending.current = null;
      client.setQueryData(queryKey, data);
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
    move.mutate(pending.current);
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const direction = keys[event.key];
    if (!direction) return;
    event.preventDefault();
    attempt(direction);
  }

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="maze-title">
      <h2 id="maze-title" className="flex items-center gap-2 text-xl font-semibold">
        <Map className="h-5 w-5 text-blue-500" /> Labirinto
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Encontre a saída no menor tempo e movimentos possíveis. As células visitadas ficam marcadas
        suavemente no caminho.
      </p>

      {today.isPending && (
        <p className="mt-4" role="status">
          Carregando desafio…
        </p>
      )}
      {today.isError && (
        <p className="mt-4" role="alert">
          Não foi possível carregar o labirinto.{" "}
          <button className="text-primary underline" onClick={() => void today.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}

      {(previous.data?.status === "IN_PROGRESS" || showPrevious) && (
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            pending.current = null;
            setShowPrevious(!showPrevious);
          }}
        >
          {showPrevious ? "Voltar ao desafio de hoje" : "Retomar desafio de ontem"}
        </Button>
      )}

      {state && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Desafio de {state.date}</span>

            <span>·</span>

            <span>
              {state.moves} {state.moves === 1 ? "movimento" : "movimentos"}
            </span>
            {state.status === "IN_PROGRESS" && (
              <>
                <span>·</span>

                <span className="flex items-center gap-1 font-mono font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  {formatTime(elapsedSeconds)}
                </span>
              </>
            )}
          </div>

          {state.status === "NOT_STARTED" && (
            <div>
              <Button onClick={() => start.mutate()} disabled={start.isPending}>
                {start.isPending ? "Iniciando…" : "Começar desafio"}
              </Button>
              {start.isError && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  Não foi possível iniciar o desafio.
                </p>
              )}
            </div>
          )}

          {state.passages && (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div
                tabIndex={0}
                onKeyDown={onKey}
                role="application"
                aria-label={`Labirinto, coluna ${(state.position % 9) + 1}, linha ${Math.floor(state.position / 9) + 1}. A saída está na coluna 9, linha 9. Use as setas para mover.`}
                className="grid aspect-square w-full max-w-[300px] xs:max-w-[340px] sm:max-w-sm grid-cols-9 outline-primary focus-visible:outline focus-visible:outline-2 select-none border border-border/40 rounded bg-card/40"
              >
                {state.passages.map((cell, i) => {
                  const isCurrent = i === state.position;
                  const isVisited = visited.has(i) && !isCurrent;
                  return (
                    <div
                      key={i}
                      aria-hidden="true"
                      className={`relative grid place-items-center transition-colors duration-200 ${
                        isVisited ? "bg-primary/10" : ""
                      }`}
                      style={{
                        borderTop: cell & 1 ? "1px solid transparent" : "2px solid currentColor",
                        borderRight: cell & 2 ? "1px solid transparent" : "2px solid currentColor",
                        borderBottom: cell & 4 ? "1px solid transparent" : "2px solid currentColor",
                        borderLeft: cell & 8 ? "1px solid transparent" : "2px solid currentColor",
                      }}
                    >
                      {i === 80 && (
                        <span
                          className="text-xs font-bold text-primary animate-pulse"
                          title="Saída"
                        >
                          🏁
                        </span>
                      )}
                      {isVisited && i !== 80 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                      )}
                      {isCurrent && (
                        <span className="absolute h-3.5 w-3.5 rounded-full bg-primary shadow-sm transition-all duration-150" />
                      )}
                    </div>
                  );
                })}
              </div>

              {state.status === "IN_PROGRESS" && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium sm:hidden">
                    Toque para mover
                  </span>

                  <div
                    className="grid grid-cols-3 gap-1.5 w-36 touch-manipulation select-none"
                    aria-label="Controles de movimento"
                  >
                    <div />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-lg text-base touch-manipulation active:scale-95"
                      aria-label="Mover para cima"
                      disabled={move.isPending}
                      onClick={() => attempt("UP")}
                    >
                      ↑
                    </Button>

                    <div />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-lg text-base touch-manipulation active:scale-95"
                      aria-label="Mover para a esquerda"
                      disabled={move.isPending}
                      onClick={() => attempt("LEFT")}
                    >
                      ←
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-lg text-base touch-manipulation active:scale-95"
                      aria-label="Mover para baixo"
                      disabled={move.isPending}
                      onClick={() => attempt("DOWN")}
                    >
                      ↓
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-lg text-base touch-manipulation active:scale-95"
                      aria-label="Mover para a direita"
                      disabled={move.isPending}
                      onClick={() => attempt("RIGHT")}
                    >
                      →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {move.isError && (
            <p role="alert" className="text-sm text-destructive">
              {move.error instanceof Error ? move.error.message : "Não foi possível mover."}
            </p>
          )}

          {state.status === "WON" && (
            <div
              role="status"
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-600 dark:text-emerald-400"
            >
              <p className="font-semibold text-base">🎉 Você encontrou a saída!</p>

              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Completado em{" "}
                <strong>
                  {state.moves} {state.moves === 1 ? "movimento" : "movimentos"}
                </strong>
                {state.startedAt && state.completedAt && (
                  <>
                    {" "}
                    e{" "}
                    <strong>
                      {Math.max(
                        0,
                        (new Date(state.completedAt).getTime() -
                          new Date(state.startedAt).getTime()) /
                          1000,
                      ).toFixed(1)}{" "}
                      segundos
                    </strong>
                  </>
                )}
                .
              </p>
            </div>
          )}
        </div>
      )}

      <h3 className="mt-6 font-semibold">Ranking de hoje</h3>
      {ranking.isPending && (
        <p className="mt-2 text-sm" role="status">
          Carregando ranking…
        </p>
      )}
      {ranking.isError && (
        <p className="mt-2 text-sm" role="alert">
          Não foi possível carregar o ranking.{" "}
          <button className="text-primary underline" onClick={() => void ranking.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {ranking.data &&
        (ranking.data.items.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Ainda não há resultados.</p>
        ) : (
          <ol className="mt-2 divide-y divide-border">
            {ranking.data.items.map((item, i) => (
              <li key={item.username} className="flex justify-between gap-2 py-2 text-sm">
                <span>
                  {i + 1}.{" "}
                  <Link
                    to="/perfil/$username"
                    params={{ username: item.username }}
                    className="text-primary underline"
                  >
                    {item.name}
                  </Link>
                </span>

                <span>
                  {(item.elapsedMillis / 1000).toFixed(1)} s · {item.moves} movimentos
                </span>
              </li>
            ))}
          </ol>
        ))}
    </section>
  );
}
