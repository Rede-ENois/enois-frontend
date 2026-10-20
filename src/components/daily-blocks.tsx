import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import type { BlocksAction } from "@/types/application/daily-games/blocks-action";
import type { BlocksState } from "@/types/application/daily-games/blocks-state";
import { Boxes } from "lucide-react";

import { ApiError, randomUUID } from "@/lib/api-client";
import { dailyBlocksApi, previousChallengeDate } from "@/lib/api/daily-games";

import { Button } from "@/components/ui/button";

// Espelho do BlocksEngine.java (rules version 2): grade 10x20, gravidade a cada 5 ticks de
// 100 ms, rotação horária sem wall kick, peça O não gira, spawn em x=3/y=0, pontuação
// 100/300/500/800 e objetivo diario de 3 linhas.
const WIDTH = 10;
const HEIGHT = 20;
const TARGET_LINES = 3;
const TICK_MS = 100;
const GRAVITY_EVERY = 5;
const MAX_TICKS = 6000;
const MAX_ACTIONS = 6000;
const REFILL_THRESHOLD = 20;

const SHAPES: number[][][] = [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
];
const SHAPE_NAMES = ["I", "O", "T", "S", "Z", "J", "L"];

// Cores temáticas para cada tipo de peça
const PIECE_COLORS: Record<number, { bg: string; text: string; ghost: string }> = {
  0: { bg: "bg-cyan-500", text: "text-white", ghost: "border-cyan-500/60 bg-cyan-500/20" }, // I
  1: { bg: "bg-amber-400", text: "text-amber-950", ghost: "border-amber-400/60 bg-amber-400/20" }, // O
  2: { bg: "bg-purple-500", text: "text-white", ghost: "border-purple-500/60 bg-purple-500/20" }, // T
  3: { bg: "bg-emerald-500", text: "text-white", ghost: "border-emerald-500/60 bg-emerald-500/20" }, // S
  4: { bg: "bg-rose-500", text: "text-white", ghost: "border-rose-500/60 bg-rose-500/20" }, // Z
  5: { bg: "bg-blue-500", text: "text-white", ghost: "border-blue-500/60 bg-blue-500/20" }, // J
  6: { bg: "bg-orange-500", text: "text-white", ghost: "border-orange-500/60 bg-orange-500/20" }, // L
};
const keys: Record<string, BlocksAction> = {
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  ArrowUp: "ROTATE",
  ArrowDown: "SOFT_DROP",
  " ": "HARD_DROP",
};
const buttons: { action: BlocksAction; label: string; symbol: string }[] = [
  { action: "LEFT", label: "Mover para a esquerda", symbol: "←" },
  { action: "ROTATE", label: "Girar a peça", symbol: "↻" },
  { action: "RIGHT", label: "Mover para a direita", symbol: "→" },
  { action: "SOFT_DROP", label: "Descida suave", symbol: "↓" },
  { action: "HARD_DROP", label: "Queda instantânea", symbol: "⤓" },
];

function shapeCells(piece: number, rotation: number): { x: number; y: number }[] {
  return SHAPES[piece].map(([cx, cy]) => {
    let x = cx;
    let y = cy;
    if (piece !== 1) {
      for (let turn = 0; turn < rotation; turn++) {
        const old = x;
        x = -y;
        y = old;
      }
    }
    return { x, y };
  });
}

function freshBag(): number[] {
  const bag = [0, 1, 2, 3, 4, 5, 6];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function createLocalGame() {
  return {
    rows: Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => ".")),
    bag: freshBag(),
    // Fila oficial de próximas peças (vem de BlocksState.pieces); o bag local é o fallback.
    queue: [] as number[],
    piecesSync: false,
    requestRefill: null as (() => void) | null,
    piece: 0,
    rotation: 0,
    x: 3,
    y: 0,
    next: 0,
    score: 0,
    lines: 0,
    ticks: 0,
    actions: 0,
    lastInputTick: -1,
    status: "PLAYING" as "PLAYING" | "WON" | "LOST" | "TIMED_OUT",
  };
}

function takeNext(game: ReturnType<typeof createLocalGame>): number {
  if (game.queue.length > 0) return game.queue.shift() ?? 0;
  if (game.bag.length === 0) game.bag = freshBag();
  return game.bag.pop() ?? 0;
}

function fits(
  game: ReturnType<typeof createLocalGame>,
  x: number,
  y: number,
  rotation: number,
): boolean {
  return shapeCells(game.piece, rotation).every((cell) => {
    const bx = x + cell.x;
    const by = y + cell.y;
    return bx >= 0 && bx < WIDTH && by >= 0 && by < HEIGHT && game.rows[by][bx] === ".";
  });
}

function gameCells(game: ReturnType<typeof createLocalGame>): { x: number; y: number }[] {
  return shapeCells(game.piece, game.rotation).map((cell) => ({
    x: game.x + cell.x,
    y: game.y + cell.y,
  }));
}

function getGhostY(game: ReturnType<typeof createLocalGame>): number {
  let gy = game.y;
  while (fits(game, game.x, gy + 1, game.rotation)) {
    gy++;
  }
  return gy;
}

function ghostCells(game: ReturnType<typeof createLocalGame>): { x: number; y: number }[] {
  const gy = getGhostY(game);
  return shapeCells(game.piece, game.rotation).map((cell) => ({
    x: game.x + cell.x,
    y: gy + cell.y,
  }));
}

function spawn(game: ReturnType<typeof createLocalGame>) {
  game.piece = game.next;
  game.rotation = 0;
  game.x = 3;
  game.y = 0;
  game.next = takeNext(game);
  if (game.piecesSync && game.queue.length < REFILL_THRESHOLD) game.requestRefill?.();
  if (!fits(game, game.x, game.y, game.rotation)) game.status = "LOST";
}

function lock(game: ReturnType<typeof createLocalGame>) {
  for (const cell of shapeCells(game.piece, game.rotation)) {
    game.rows[game.y + cell.y][game.x + cell.x] = "#";
  }
  let cleared = 0;
  for (let row = HEIGHT - 1; row >= 0; row--) {
    if (game.rows[row].every((ch) => ch === "#")) {
      game.rows.splice(row, 1);
      game.rows.unshift(Array.from({ length: WIDTH }, () => "."));
      cleared++;
      row++;
    }
  }
  game.lines += cleared;
  game.score +=
    cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : cleared === 4 ? 800 : 0;
  if (game.lines >= TARGET_LINES) game.status = "WON";
  else spawn(game);
}

function gravity(game: ReturnType<typeof createLocalGame>) {
  if (game.status !== "PLAYING") return;
  if (fits(game, game.x, game.y + 1, game.rotation)) game.y++;
  else lock(game);
}

function stepGame(game: ReturnType<typeof createLocalGame>, action: BlocksAction) {
  if (game.status !== "PLAYING") return;
  game.actions++;
  if (action === "LEFT") {
    if (fits(game, game.x - 1, game.y, game.rotation)) game.x--;
  } else if (action === "RIGHT") {
    if (fits(game, game.x + 1, game.y, game.rotation)) game.x++;
  } else if (action === "ROTATE") {
    const rotation = (game.rotation + 1) % 4;
    if (fits(game, game.x, game.y, rotation)) game.rotation = rotation;
  } else if (action === "SOFT_DROP") {
    gravity(game);
  } else if (action === "HARD_DROP") {
    while (fits(game, game.x, game.y + 1, game.rotation)) game.y++;
    lock(game);
  }
}

function identifyPiece(
  cells: { x: number; y: number }[],
): { piece: number; rotation: number; x: number; y: number } | null {
  if (cells.length !== 4) return null;
  const placed = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
  for (let piece = 0; piece < SHAPES.length; piece++) {
    for (let rotation = 0; rotation < 4; rotation++) {
      const shape = shapeCells(piece, rotation);
      for (const anchor of cells) {
        const x = anchor.x - shape[0].x;
        const y = anchor.y - shape[0].y;
        if (shape.every((cell) => placed.has(`${x + cell.x},${y + cell.y}`))) {
          return { piece, rotation, x, y };
        }
      }
    }
  }
  return null;
}

function identifyShape(cells: { x: number; y: number }[]): number {
  const key = cells
    .map((cell) => `${cell.x},${cell.y}`)
    .sort()
    .join(" ");
  for (let piece = 0; piece < SHAPES.length; piece++) {
    const shape = SHAPES[piece]
      .map(([x, y]) => `${x},${y}`)
      .sort()
      .join(" ");
    if (shape === key) return piece;
  }
  return -1;
}

function normalizePieces(input: number[] | undefined): number[] {
  if (!Array.isArray(input)) return [];
  return input.filter((piece) => Number.isInteger(piece) && piece >= 0 && piece < SHAPES.length);
}

function fromServerState(state: BlocksState): ReturnType<typeof createLocalGame> {
  const game = createLocalGame();
  if (state.board.length === HEIGHT && state.board.every((row) => row.length === WIDTH)) {
    game.rows = state.board.map((row) => row.split(""));
  }
  game.score = state.score;
  game.lines = state.lines;
  game.actions = state.actions;
  const current = identifyPiece(state.activeCells);
  if (current) {
    game.piece = current.piece;
    game.rotation = current.rotation;
    game.x = current.x;
    game.y = current.y;
  }
  const serverPieces = normalizePieces(state.pieces);
  if (serverPieces.length > 0) {
    // Sequência oficial: pieces[0] é a peça logo após a ativa (igual a nextCells).
    game.piecesSync = true;
    if (current) {
      game.next = serverPieces[0];
      game.queue = serverPieces.slice(1);
    } else {
      game.piece = serverPieces[0];
      game.next = serverPieces.length > 1 ? serverPieces[1] : takeNext(game);
      game.queue = serverPieces.slice(2);
    }
  } else {
    // Fallback (não-PLAYING ou servidor sem pieces): mantém o bag local aleatório.
    game.next = identifyShape(state.nextCells);
    if (game.next < 0) game.next = takeNext(game);
    if (!current) game.piece = takeNext(game);
  }
  return game;
}

export function DailyBlocks() {
  const client = useQueryClient();
  const [showPrevious, setShowPrevious] = useState(false);
  const [, setFrame] = useState(0);
  const [runId, setRunId] = useState(0);
  const [official, setOfficial] = useState<BlocksState | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const gameRef = useRef<ReturnType<typeof createLocalGame> | null>(null);
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
      const serverPieces = normalizePieces(data.pieces);
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
    if (game.lastInputTick === game.ticks || game.actions >= MAX_ACTIONS) return;
    game.lastInputTick = game.ticks;
    stepGame(game, action);
    queueRef.current.push({ action, requestId: randomUUID(), attempts: 0 });
    setFrame((value) => value + 1);
    if (game.status !== "PLAYING" || game.actions >= MAX_ACTIONS) endLocal();
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
    gameRef.current = fromServerState(current);
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
      if (game.ticks % GRAVITY_EVERY === 0) gravity(game);
      if (game.ticks >= MAX_TICKS && game.status === "PLAYING") game.status = "TIMED_OUT";
      setFrame((value) => value + 1);
      if (game.status !== "PLAYING") endLocalRef.current();
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [official, runId, showPrevious, stateDate, stateStatus]);

  useEffect(() => {
    const current = stateRef.current;
    if (!official && current && current.status !== "NOT_STARTED" && current.status !== "PLAYING") {
      setOfficial(current);
    }
  }, [official, showPrevious, stateDate, stateStatus]);

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    perform(action);
  }

  const game = gameRef.current;
  const playing = Boolean(game && game.status === "PLAYING" && !official);
  const validating = Boolean(game && game.status !== "PLAYING" && !official);
  const pendingCount = queueRef.current.length + (sendingRef.current ? 1 : 0);
  const activeSet =
    playing && game
      ? new Set(gameCells(game).map((cell) => `${cell.x},${cell.y}`))
      : new Set<string>();
  const ghostSet =
    playing && game
      ? new Set(ghostCells(game).map((cell) => `${cell.x},${cell.y}`))
      : new Set<string>();
  const activePieceColor = playing && game ? (PIECE_COLORS[game.piece] ?? PIECE_COLORS[0]) : null;
  const nextPieceColor = playing && game ? (PIECE_COLORS[game.next] ?? PIECE_COLORS[0]) : null;
  const renderedRows = official
    ? official.board.map((row) => row.split(""))
    : game
      ? game.rows
      : null;
  const preview = playing && game ? shapeCells(game.next, 0) : [];
  const previewMinX = preview.length ? Math.min(...preview.map((cell) => cell.x)) : 0;
  const previewMinY = preview.length ? Math.min(...preview.map((cell) => cell.y)) : 0;

  const boardLabel = official
    ? `Tabuleiro final: ${official.score} pontos, ${official.lines} de ${TARGET_LINES} linhas limpas.`
    : game
      ? `Tabuleiro: ${game.score} pontos, ${game.lines} de ${TARGET_LINES} linhas limpas. Peça atual na coluna ${game.x + 1}, linha ${game.y + 1}. Setas movem e giram; espaço faz a queda instantânea.`
      : "Tabuleiro do jogo Blocos.";

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="blocks-title" onKeyDown={onKey}>
      <h2 id="blocks-title" className="flex items-center gap-2 text-xl font-semibold">
        <Boxes className="h-5 w-5" />
        Blocos
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Empilhe as peças e limpe {TARGET_LINES} linhas para vencer o dia. O desafio é em tempo real
        e não permite pausa.
      </p>

      {today.isPending && (
        <p className="mt-4" role="status">
          Carregando desafio…
        </p>
      )}
      {today.isError && (
        <p className="mt-4" role="alert">
          Não foi possível carregar o desafio.{" "}
          <button className="text-primary underline" onClick={() => void today.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {(previous.data?.status === "PLAYING" || showPrevious) && (
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            queueRef.current = [];
            finishingRef.current = false;
            setShowPrevious(!showPrevious);
            setOfficial(null);
            setSyncError(null);
          }}
        >
          {showPrevious ? "Voltar ao desafio de hoje" : "Retomar desafio de ontem"}
        </Button>
      )}

      {state && state.status === "NOT_STARTED" && !showPrevious && (
        <div className="mt-4">
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

      {state && state.status !== "NOT_STARTED" && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Desafio de {state.date} · objetivo: limpar {TARGET_LINES} linhas
            {official ? ` · ${official.actions} ações` : ""}
          </p>

          {!official && game && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>Pontos: {game.score}</span>

              <span>
                Linhas: {game.lines} / {TARGET_LINES}
              </span>

              <span>Tempo restante: {Math.max(0, Math.ceil((MAX_TICKS - game.ticks) / 10))} s</span>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-5">
            <div
              ref={boardRef}
              tabIndex={0}
              role="application"
              aria-label={boardLabel}
              className="grid w-52 grid-cols-10 rounded border border-border bg-card outline-primary focus-visible:outline focus-visible:outline-2"
            >
              {renderedRows?.map((row, y) =>
                row.map((cell, x) => {
                  const active = activeSet.has(`${x},${y}`);
                  const isGhost = !active && ghostSet.has(`${x},${y}`);
                  return (
                    <span
                      key={`${x}-${y}`}
                      aria-hidden="true"
                      className={`grid aspect-square place-items-center border-[0.5px] border-border/30 text-[8px] leading-none transition-colors duration-100 ${
                        cell === "#"
                          ? "bg-muted-foreground/40 text-muted-foreground"
                          : active && activePieceColor
                            ? `${activePieceColor.bg} ${activePieceColor.text} font-bold shadow-sm`
                            : isGhost && activePieceColor
                              ? `${activePieceColor.ghost} border border-dashed`
                              : ""
                      }`}
                    >
                      {cell === "#" ? "■" : active ? "◆" : ""}
                    </span>
                  );
                }),
              )}
            </div>

            {playing && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Próxima
                </p>

                <div
                  className="grid grid-cols-4 gap-1 p-2.5 rounded-lg border border-border/50 bg-muted/20"
                  role="img"
                  aria-label={`Próxima peça: ${SHAPE_NAMES[game?.next ?? 0]}`}
                >
                  {Array.from({ length: 2 }, (_, y) =>
                    Array.from({ length: 4 }, (_, x) => {
                      const on = preview.some(
                        (cell) => cell.x - previewMinX === x && cell.y - previewMinY === y,
                      );
                      return (
                        <span
                          key={`${x}-${y}`}
                          aria-hidden="true"
                          className={`grid h-4 w-4 place-items-center rounded-sm text-[10px] ${
                            on && nextPieceColor
                              ? `${nextPieceColor.bg} ${nextPieceColor.text} font-bold shadow-sm`
                              : "bg-transparent"
                          }`}
                        >
                          {on ? "◆" : ""}
                        </span>
                      );
                    }),
                  )}
                </div>
              </div>
            )}
          </div>

          {playing && (
            <div
              className="flex flex-wrap gap-2 sm:gap-2.5 touch-manipulation select-none"
              aria-label="Controles do jogo"
            >
              {buttons.map((button) => (
                <Button
                  key={button.action}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 sm:h-12 sm:w-12 text-lg active:scale-95 touch-manipulation"
                  aria-label={button.label}
                  disabled={Boolean(syncError)}
                  onClick={() => perform(button.action)}
                >
                  {button.symbol}
                </Button>
              ))}
            </div>
          )}

          {playing && pendingCount > 1 && (
            <p className="text-sm text-muted-foreground" role="status">
              Sincronizando {pendingCount} ações com o servidor…
            </p>
          )}

          {syncError && (
            <div className="text-sm text-destructive" role="alert">
              <p>{syncError}</p>

              <Button className="mt-2" variant="outline" onClick={retrySync}>
                Reconectar e continuar
              </Button>
            </div>
          )}

          {validating && (
            <p className="text-sm text-muted-foreground" role="status">
              Validando o resultado com o servidor…
            </p>
          )}

          {official && (
            <div className="space-y-1" role="status">
              <p className="font-medium">
                {official.status === "WON"
                  ? `Objetivo alcançado: ${official.lines} linhas limpas!`
                  : official.status === "LOST"
                    ? "Fim de jogo: a peça não coube."
                    : "Tempo esgotado."}
              </p>

              <p>
                Resultado oficial: {official.score} pontos · {official.lines} de {TARGET_LINES}{" "}
                linhas · resultado validado pelo servidor.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ■ peças fixas · ◆ peça atual · o placar exibido durante a partida é local; o resultado
            oficial é validado pelo servidor ao fim do desafio.
          </p>
        </div>
      )}

      <h3 className="mt-5 font-semibold">Ranking de hoje</h3>
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
            {ranking.data.items.map((item, index) => (
              <li key={item.username} className="flex justify-between gap-2 py-2 text-sm">
                <span>
                  {index + 1}.{" "}
                  <Link
                    to="/perfil/$username"
                    params={{ username: item.username }}
                    className="text-primary underline"
                  >
                    {item.name}
                  </Link>
                </span>

                <span>
                  {item.score} pts · {item.lines} {item.lines === 1 ? "linha" : "linhas"} ·{" "}
                  {(item.elapsedMillis / 1000).toFixed(1)} s
                </span>
              </li>
            ))}
          </ol>
        ))}
    </section>
  );
}
