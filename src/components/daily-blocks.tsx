import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BlocksAction } from "@/types/application/daily-games/blocks-action";
import type { BlocksState } from "@/types/application/daily-games/blocks-state";
import {
  BLOCKS_GRAVITY_EVERY,
  BLOCKS_MAX_ACTIONS,
  BLOCKS_MAX_TICKS,
  BLOCKS_TICK_MS,
  type BlocksLocalGame,
  DailyBlocks as DailyBlocksView,
  blocksFromServerState,
  blocksGravity,
  normalizeBlocksPieces,
  stepBlocksGame,
} from "@rede-enois/design-system/domain";

import { ApiError, randomUUID } from "@/lib/api-client";
import { dailyBlocksApi, previousChallengeDate } from "@/lib/api/daily-games";

// O motor da partida (espelho do BlocksEngine.java) mora no design system; aqui ficam o loop de
// ticks, a fila de ações e a sincronização com o servidor.
export function DailyBlocks() {
  const client = useQueryClient();
  const [showPrevious, setShowPrevious] = useState(false);
  const [, setFrame] = useState(0);
  const [runId, setRunId] = useState(0);
  const [official, setOfficial] = useState<BlocksState | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const gameRef = useRef<BlocksLocalGame | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const queueRef = useRef<{ action: BlocksAction; requestId: string; attempts: number }[]>([]);
  const sendingRef = useRef(false);
  const lastSentRef = useRef(0);
  const finishingRef = useRef(false);
  const syncErrorRef = useRef<string | null>(null);
  const pumpRef = useRef<() => Promise<void>>(async () => {});
  const endLocalRef = useRef<() => void>(() => {});
  const piecesFetchingRef = useRef(false);
  const piecesFetchedAtRef = useRef(0);

  syncErrorRef.current = syncError;

  const today = useQuery({
    queryKey: ["daily-games", "blocks", "today"],
    queryFn: () => dailyBlocksApi.today(),
  });
  const previousDate = today.data ? previousChallengeDate(today.data.date) : undefined;
  const previous = useQuery({
    queryKey: ["daily-games", "blocks", "previous", previousDate],
    queryFn: () => dailyBlocksApi.today(previousDate),
    enabled: Boolean(previousDate),
  });
  const ranking = useQuery({
    queryKey: ["daily-games", "blocks", "leaderboard"],
    queryFn: dailyBlocksApi.leaderboard,
  });
  const state = showPrevious ? previous.data : today.data;
  const stateDate = state?.date;
  const stateStatus = state?.status;

  const activeRef = useRef<{ date: string | undefined; key: unknown[] }>({
    date: undefined,
    key: [],
  });
  activeRef.current = {
    date: showPrevious ? previousDate : undefined,
    key: showPrevious
      ? ["daily-games", "blocks", "previous", previousDate]
      : ["daily-games", "blocks", "today"],
  };
  const stateRef = useRef<BlocksState | undefined>(undefined);
  stateRef.current = state;

  const start = useMutation({
    mutationFn: dailyBlocksApi.start,
    onSuccess: (data) => {
      setOfficial(null);
      client.setQueryData(["daily-games", "blocks", "today"], data);
    },
    onError: () => {
      void today.refetch();
    },
  });

  function finishServer(data: BlocksState) {
    setOfficial(data);
    queueRef.current = [];
    finishingRef.current = false;
    if (data.status === "WON") {
      void client.invalidateQueries({ queryKey: ["daily-games", "blocks", "leaderboard"] });
    }
  }

  async function resync() {
    try {
      const data = await client.fetchQuery({
        queryKey: activeRef.current.key,
        queryFn: () => dailyBlocksApi.today(activeRef.current.date),
      });
      if (data.status === "PLAYING") setRunId((value) => value + 1);
      else finishServer(data);
    } catch {
      setSyncError("Não foi possível validar o resultado com o servidor.");
    }
  }

  async function pump() {
    if (sendingRef.current) return;
    const head = queueRef.current[0];
    if (!head) {
      if (finishingRef.current) {
        finishingRef.current = false;
        await resync();
      }
      return;
    }
    if (lastSentRef.current && Date.now() - lastSentRef.current < 90) {
      window.setTimeout(() => void pumpRef.current(), 90);
      return;
    }
    sendingRef.current = true;
    lastSentRef.current = Date.now();
    try {
      const data = await dailyBlocksApi.action(head.action, head.requestId, activeRef.current.date);
      sendingRef.current = false;
      queueRef.current.shift();
      if (data.status !== "PLAYING") {
        finishServer(data);
        return;
      }
      void pumpRef.current();
    } catch (error) {
      sendingRef.current = false;
      const status = error instanceof ApiError ? error.status : 0;
      const code = error instanceof ApiError ? error.code : undefined;
      if (code === "GAME_FINISHED" || code === "ACTION_LIMIT" || code === "GAME_NOT_STARTED") {
        queueRef.current = [];
        await resync();
        return;
      }
      const retryable = status === 0 || status === 429 || status >= 500;
      if (retryable && head.attempts < 3) {
        head.attempts++;
        window.setTimeout(() => void pumpRef.current(), 400 * head.attempts);
        return;
      }
      if (retryable) {
        setSyncError("Falha de conexão ao sincronizar com o servidor. O jogo foi pausado.");
        return;
      }
      queueRef.current = [];
      setSyncError(error instanceof Error ? error.message : "Não foi possível registrar a ação.");
      void resync();
    }
  }
  pumpRef.current = pump;

  function endLocal() {
    finishingRef.current = true;
    if (!sendingRef.current) void pumpRef.current();
  }
  endLocalRef.current = endLocal;

  // Reabastece a fila de peças com a sequência oficial do servidor sem interromper o
  // loop local: mantém o último estado conhecido enquanto a requisição está em voo.
  async function refillPieces() {
    if (piecesFetchingRef.current || Date.now() - piecesFetchedAtRef.current < 2000) return;
    piecesFetchingRef.current = true;
    try {
      const data = await dailyBlocksApi.today(activeRef.current.date);
      piecesFetchedAtRef.current = Date.now();
      const game = gameRef.current;
      if (!game || game.status !== "PLAYING") return;
      const serverPieces = normalizeBlocksPieces(data.pieces);
      if (serverPieces.length === 0) {
        // Servidor sem a sequência (ou fora de PLAYING): segue com o bag local.
        game.piecesSync = false;
        return;
      }
      game.next = serverPieces[0];
      game.queue = serverPieces.slice(1);
    } catch {
      // Falha de rede: conserva a fila atual; nova tentativa no próximo consumo baixo.
    } finally {
      piecesFetchingRef.current = false;
    }
  }

  function perform(action: BlocksAction) {
    const game = gameRef.current;
    if (!game || game.status !== "PLAYING" || official || syncError) return;
    if (game.lastInputTick === game.ticks || game.actions >= BLOCKS_MAX_ACTIONS) return;
    game.lastInputTick = game.ticks;
    stepBlocksGame(game, action);
    queueRef.current.push({ action, requestId: randomUUID(), attempts: 0 });
    setFrame((value) => value + 1);
    if (game.status !== "PLAYING" || game.actions >= BLOCKS_MAX_ACTIONS) endLocal();
    else void pumpRef.current();
  }

  function retrySync() {
    setSyncError(null);
    if (queueRef.current.length > 0 || finishingRef.current) void pumpRef.current();
    else void resync();
  }

  useEffect(() => {
    const current = stateRef.current;
    if (!current || current.status !== "PLAYING" || official) {
      gameRef.current = null;
      return;
    }
    gameRef.current = blocksFromServerState(current);
    gameRef.current.requestRefill = () => void refillPieces();
    piecesFetchingRef.current = false;
    // A fila já nasceu semeada com as pieces deste estado; evita reabastecer imediatamente.
    piecesFetchedAtRef.current = Date.now();
    setFrame((value) => value + 1);
    boardRef.current?.focus({ preventScroll: true });
    const timer = window.setInterval(() => {
      const game = gameRef.current;
      if (!game || game.status !== "PLAYING" || syncErrorRef.current) return;
      game.ticks++;
      if (game.ticks % BLOCKS_GRAVITY_EVERY === 0) blocksGravity(game);
      if (game.ticks >= BLOCKS_MAX_TICKS && game.status === "PLAYING") game.status = "TIMED_OUT";
      setFrame((value) => value + 1);
      if (game.status !== "PLAYING") endLocalRef.current();
    }, BLOCKS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [official, runId, showPrevious, stateDate, stateStatus]);

  useEffect(() => {
    const current = stateRef.current;
    if (!official && current && current.status !== "NOT_STARTED" && current.status !== "PLAYING") {
      setOfficial(current);
    }
  }, [official, showPrevious, stateDate, stateStatus]);

  const game = gameRef.current;
  const pendingCount = queueRef.current.length + (sendingRef.current ? 1 : 0);

  return (
    <DailyBlocksView
      loading={today.isPending}
      loadError={today.isError}
      onRetryLoad={() => void today.refetch()}
      canTogglePrevious={previous.data?.status === "PLAYING" || showPrevious}
      showPrevious={showPrevious}
      onTogglePrevious={() => {
        queueRef.current = [];
        finishingRef.current = false;
        setShowPrevious(!showPrevious);
        setOfficial(null);
        setSyncError(null);
      }}
      state={state}
      onStart={() => start.mutate()}
      startPending={start.isPending}
      startError={start.isError}
      game={game}
      official={official}
      pendingCount={pendingCount}
      syncError={syncError}
      onAction={perform}
      onRetrySync={retrySync}
      boardRef={boardRef}
      ranking={{
        loading: ranking.isPending,
        error: ranking.isError,
        onRetry: () => void ranking.refetch(),
        items: ranking.data?.items.map((item) => ({ ...item, href: `/perfil/${item.username}` })),
      }}
    />
  );
}
