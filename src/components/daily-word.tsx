import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import type { WordMark } from "@/types/application/daily-games/word-mark";
import type { WordState } from "@/types/application/daily-games/word-state";
import type { RowProps } from "@/types/components/daily-word/row-props";
import type { TileProps } from "@/types/components/daily-word/tile-props";
import type { TileState } from "@/types/components/daily-word/tile-state";
import type { UserWordStats } from "@/types/components/daily-word/user-word-stats";
import { BarChart2, HelpCircle, Share2, Sparkles, Type } from "lucide-react";

import { randomUUID } from "@/lib/api-client";
import { dailyWordsApi, previousChallengeDate } from "@/lib/api/daily-games";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Estatísticas e Persistência Local ─────────────────────────────────────────

const STATS_STORAGE_KEY = "enois_wordle_stats_v1";

function loadWordStats(): UserWordStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // storage indisponível: segue sem persistir
  }
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  };
}

function recordWordGame(won: boolean, attempts: number, date: string): UserWordStats {
  const current = loadWordStats();
  if (current.lastRecordedDate === date) return current;

  const next: UserWordStats = {
    played: current.played + 1,
    won: won ? current.won + 1 : current.won,
    currentStreak: won ? current.currentStreak + 1 : 0,
    maxStreak: won ? Math.max(current.maxStreak, current.currentStreak + 1) : current.maxStreak,
    distribution: {
      ...current.distribution,
      ...(won ? { [attempts]: (current.distribution[attempts] || 0) + 1 } : {}),
    },
    lastRecordedDate: date,
  };

  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage indisponível: segue sem persistir
  }
  return next;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

// Mapeamento físico de teclado → letra (normaliza acentos para a versão sem acento)
const PHYSICAL_KEYS: Record<string, string> = {
  Enter: "ENTER",
  Backspace: "⌫",
};
for (const row of KEYBOARD_ROWS) {
  for (const key of row) {
    if (key !== "ENTER" && key !== "⌫") PHYSICAL_KEYS[key] = key;
  }
}

// ─── Helpers de cor ─────────────────────────────────────────────────────────────

/**
 * Tile responsiva: usa CSS custom property --tile-size calculada no wrapper da grade.
 * O tamanho flui entre ~48 px (320 px viewport) e 62 px (desktop).
 */
function tileClasses(state: TileState, revealed: boolean): string {
  // w/h via inline style no wrapper; aqui usamos w-full aspect-square para preencher
  const base =
    "relative flex aspect-square w-full items-center justify-center rounded font-bold uppercase select-none border-2 transition-colors text-[clamp(1rem,4vw,1.375rem)] touch-manipulation";

  if (!revealed) {
    if (state === "typing")
      return `${base} border-foreground/60 bg-transparent text-foreground scale-105 transition-transform`;
    return `${base} border-border/40 bg-transparent text-foreground`;
  }

  switch (state) {
    case "CORRECT":
      return `${base} border-transparent bg-[#21a35d] text-white`;
    case "PRESENT":
      return `${base} border-transparent bg-[#c8a227] text-white`;
    case "ABSENT":
      return `${base} border-transparent bg-muted text-muted-foreground`;
    default:
      return `${base} border-border/40 bg-transparent text-foreground`;
  }
}

/** Retorna as classes do botão de teclado virtual conforme o melhor mark da letra. */
function keyClasses(mark: WordMark | undefined, isAction: boolean): string {
  // Altura fluida; teclas de ação (ENTER/⌫) são proporcionalmente mais largas via flex
  const base = [
    "flex items-center justify-center rounded",
    "text-[clamp(0.65rem,2.5vw,0.875rem)] font-semibold uppercase",
    "h-[clamp(2.5rem,8vw,3.5rem)]",
    isAction ? "flex-[1.5]" : "flex-1",
    "min-w-0 cursor-pointer select-none",
    "transition-colors duration-300 active:scale-95 touch-manipulation",
  ].join(" ");
  switch (mark) {
    case "CORRECT":
      return `${base} bg-[#21a35d] text-white`;
    case "PRESENT":
      return `${base} bg-[#c8a227] text-white`;
    case "ABSENT":
      return `${base} bg-muted text-muted-foreground`;
    default:
      return `${base} bg-muted/60 text-foreground hover:bg-muted`;
  }
}

// ─── Derivar estado do teclado a partir dos palpites confirmados ────────────────

function buildKeyMap(guesses: WordState["guesses"]): Record<string, WordMark> {
  const priority: Record<WordMark, number> = { CORRECT: 2, PRESENT: 1, ABSENT: 0 };
  const map: Record<string, WordMark> = {};
  for (const { word, marks } of guesses) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const mark = marks[i];
      if (!map[letter] || priority[mark] > priority[map[letter]]) {
        map[letter] = mark;
      }
    }
  }
  return map;
}

// ─── Sub-componente: célula da grade ──────────────────────────────────────────

function Tile({ letter, state, revealed, col, animate }: TileProps) {
  const [flipped, setFlipped] = useState(false);
  const [displayState, setDisplayState] = useState<TileState>(revealed ? state : state);

  useEffect(() => {
    if (!animate || !revealed) return;
    const delay = col * 300;
    // Vira para branco na metade da animação e aplica a cor real
    const t1 = window.setTimeout(() => setFlipped(true), delay);
    const t2 = window.setTimeout(() => {
      setDisplayState(state);
      setFlipped(false);
    }, delay + 150);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [animate, col, revealed, state]);

  return (
    <div
      aria-label={letter || "vazio"}
      className={tileClasses(displayState, revealed)}
      style={{
        transform: flipped ? "rotateX(90deg)" : undefined,
        transition: flipped ? "transform 150ms ease-in" : "transform 150ms ease-out",
      }}
    >
      {letter}
    </div>
  );
}

// ─── Sub-componente: linha da grade ───────────────────────────────────────────

function Row({ letters, marks, shake, animateReveal }: RowProps) {
  return (
    <div role="row" className={`grid grid-cols-5 gap-1.5 sm:gap-2 ${shake ? "animate-shake" : ""}`}>
      {Array.from({ length: WORD_LENGTH }, (_, i) => {
        const letter = letters[i] ?? "";
        const mark = marks?.[i] ?? null;
        const revealed = marks !== null;
        const state: TileState = revealed ? (mark as WordMark) : letter ? "typing" : "empty";
        return (
          <Tile
            key={i}
            col={i}
            letter={letter}
            state={state}
            revealed={revealed}
            animate={animateReveal}
          />
        );
      })}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function DailyWord() {
  const client = useQueryClient();
  const [showPrevious, setShowPrevious] = useState(false);
  const [draft, setDraft] = useState(""); // letras digitadas na linha atual
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [lastConfirmedRow, setLastConfirmedRow] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<UserWordStats>(loadWordStats);
  const requestIdRef = useRef<string>(randomUUID());

  const today = useQuery({
    queryKey: ["daily-games", "words", "today"],
    queryFn: () => dailyWordsApi.today(),
  });
  const previousDate = today.data ? previousChallengeDate(today.data.date) : undefined;
  const previous = useQuery({
    queryKey: ["daily-games", "words", "previous", previousDate],
    queryFn: () => dailyWordsApi.today(previousDate),
    enabled: Boolean(previousDate),
  });
  const ranking = useQuery({
    queryKey: ["daily-games", "words", "leaderboard"],
    queryFn: dailyWordsApi.leaderboard,
  });

  const queryKey = showPrevious
    ? ["daily-games", "words", "previous", previousDate]
    : ["daily-games", "words", "today"];
  const state = showPrevious ? previous.data : today.data;

  const start = useMutation({
    mutationFn: dailyWordsApi.start,
    onSuccess: (data) => {
      client.setQueryData(["daily-games", "words", "today"], data);
      setDraft("");
      setLastConfirmedRow(null);
    },
    onError: () => void today.refetch(),
  });

  const guess = useMutation({
    mutationFn: ({ word, requestId, date }: { word: string; requestId: string; date?: string }) =>
      dailyWordsApi.guess(word, requestId, date),
    onSuccess: (data) => {
      client.setQueryData(queryKey, data);
      setLastConfirmedRow(data.guesses.length - 1);
      setDraft("");
      requestIdRef.current = randomUUID();
      if (data.status === "WON" || data.status === "LOST") {
        void client.invalidateQueries({ queryKey: ["daily-games", "words", "leaderboard"] });
        const updated = recordWordGame(data.status === "WON", data.guesses.length, data.date);
        setStats(updated);
        window.setTimeout(() => setStatsOpen(true), 1200);
      }
    },
    onError: (error) => {
      // Traduz erros do servidor para mensagens amigáveis
      let msg = "Não foi possível registrar o palpite.";
      if (error instanceof Error) {
        if (error.message.includes("vocabulario") || error.message.includes("INVALID_GUESS")) {
          msg = "Palavra não encontrada no dicionário.";
        } else if (error.message.includes("GAME_FINISHED")) {
          msg = "O desafio já foi encerrado.";
        } else if (error.message.includes("GUESS_ALREADY_USED")) {
          msg = "Você já usou essa palavra hoje.";
        } else {
          msg = error.message;
        }
      }
      setLocalError(msg);
      triggerShake(state?.guesses.length ?? 0);
      requestIdRef.current = randomUUID();
    },
  });

  function triggerShake(row: number) {
    setShakeRow(row);
    window.setTimeout(() => setShakeRow(null), 600);
  }

  function showError(msg: string) {
    setLocalError(msg);
    window.setTimeout(() => setLocalError(null), 2000);
  }

  const submit = useCallback(() => {
    if (!state || state.status !== "IN_PROGRESS" || guess.isPending) return;
    if (draft.length < WORD_LENGTH) {
      showError("A palavra precisa ter 5 letras.");
      triggerShake(state.guesses.length);
      return;
    }
    setLocalError(null);
    guess.mutate({
      word: draft,
      requestId: requestIdRef.current,
      date: showPrevious ? previousDate : undefined,
    });
  }, [state, guess, draft, showPrevious, previousDate]);

  const handleKey = useCallback(
    (key: string) => {
      if (!state || state.status !== "IN_PROGRESS" || guess.isPending) return;
      setLocalError(null);
      if (key === "ENTER") {
        submit();
      } else if (key === "⌫") {
        setDraft((d) => d.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && draft.length < WORD_LENGTH) {
        setDraft((d) => d + key);
      }
    },
    [state, guess.isPending, draft, submit],
  );

  // Teclado físico
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const mapped = PHYSICAL_KEYS[e.key] ?? (e.key.length === 1 ? e.key.toUpperCase() : null);
      if (!mapped) return;
      e.preventDefault();
      handleKey(mapped);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  // Monta a grade de linhas (confirmadas + linha ativa + vazias)
  const confirmedGuesses = state?.guesses ?? [];
  const keyMap = buildKeyMap(confirmedGuesses);
  const isPlaying = state?.status === "IN_PROGRESS";
  const isFinished = state?.status === "WON" || state?.status === "LOST";

  // Resultado para compartilhar
  function buildShareText(): string {
    const emojiMap: Record<WordMark, string> = {
      CORRECT: "🟩",
      PRESENT: "🟨",
      ABSENT: "⬛",
    };
    const lines = confirmedGuesses
      .map(({ marks }) => marks.map((m) => emojiMap[m]).join(""))
      .join("\n");
    return `Palavras Énois · ${confirmedGuesses.length}/${MAX_GUESSES}\n\n${lines}`;
  }

  async function share() {
    const text = buildShareText();
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      showError("Resultado copiado!");
    }
  }

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="words-title">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="words-title" className="flex items-center gap-2 text-xl font-semibold">
            <Type className="h-5 w-5 text-emerald-500" />
            Palavras
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Descubra a palavra de 5 letras em até {MAX_GUESSES} tentativas.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs touch-manipulation"
            onClick={() => setHowToPlayOpen(true)}
            title="Como jogar"
          >
            <HelpCircle className="h-4 w-4 text-primary" />

            <span className="hidden sm:inline">Como jogar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs touch-manipulation"
            onClick={() => setStatsOpen(true)}
            title="Estatísticas"
          >
            <BarChart2 className="h-4 w-4 text-primary" />

            <span className="hidden sm:inline">Estatísticas</span>
          </Button>
        </div>
      </div>

      {/* Carregando */}
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

      {/* Botão de retomar desafio anterior */}
      {(previous.data?.status === "IN_PROGRESS" || showPrevious) && (
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            setShowPrevious(!showPrevious);
            setDraft("");
            setLastConfirmedRow(null);
            setLocalError(null);
          }}
        >
          {showPrevious ? "Voltar ao desafio de hoje" : "Retomar desafio de ontem"}
        </Button>
      )}

      {/* Começar desafio */}
      {state?.status === "NOT_STARTED" && !showPrevious && (
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

      {/* Jogo */}
      {state && state.status !== "NOT_STARTED" && (
        <div className="mt-5 flex flex-col items-center gap-5">
          <p className="self-start text-sm text-muted-foreground">
            Desafio de {state.date}
            {state.streak > 0 &&
              ` · 🔥 ${state.streak} ${state.streak === 1 ? "dia" : "dias"} consecutivos`}
          </p>

          {/* Erro local (palavra curta, inválida etc) */}
          {localError && (
            <div role="alert" className="rounded bg-card px-4 py-2 text-sm font-medium shadow">
              {localError}
            </div>
          )}

          {/* Grade 6 × 5 */}
          <div
            role="grid"
            aria-label="Grade de palpites"
            className="w-full max-w-[280px] xs:max-w-[310px] sm:max-w-[340px] flex flex-col gap-1.5 sm:gap-2 mx-auto"
          >
            {Array.from({ length: MAX_GUESSES }, (_, row) => {
              const confirmed = confirmedGuesses[row];
              if (confirmed) {
                return (
                  <Row
                    key={row}
                    letters={confirmed.word.split("")}
                    marks={confirmed.marks}
                    shake={false}
                    animateReveal={row === lastConfirmedRow}
                  />
                );
              }
              const isActiveRow = row === confirmedGuesses.length && isPlaying;
              return (
                <Row
                  key={row}
                  letters={isActiveRow ? draft.split("") : []}
                  marks={null}
                  shake={isActiveRow && shakeRow === row}
                  animateReveal={false}
                />
              );
            })}
          </div>

          {/* Mensagem de resultado */}
          {isFinished && (
            <div className="flex flex-col items-center gap-3 text-center" role="status">
              <p className="text-lg font-semibold">
                {state.status === "WON"
                  ? `🎉 Você acertou em ${confirmedGuesses.length} tentativa${confirmedGuesses.length === 1 ? "" : "s"}!`
                  : `😔 Não foi dessa vez. A palavra era ${confirmedGuesses.at(-1)?.word ?? "—"}.`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" className="gap-2" onClick={() => void share()}>
                  <Share2 className="h-4 w-4" />
                  Compartilhar resultado
                </Button>

                <Button variant="secondary" className="gap-2" onClick={() => setStatsOpen(true)}>
                  <BarChart2 className="h-4 w-4" />
                  Ver estatísticas
                </Button>
              </div>
            </div>
          )}

          {/* Teclado virtual */}
          {isPlaying && (
            <div
              className="w-full max-w-[480px] px-1 sm:px-2 mx-auto"
              role="group"
              aria-label="Teclado virtual"
            >
              {KEYBOARD_ROWS.map((row, ri) => (
                <div key={ri} className="mb-1 sm:mb-1.5 flex justify-center gap-1 sm:gap-1.5">
                  {row.map((key) => {
                    const isAction = key === "ENTER" || key === "⌫";
                    const mark = !isAction ? keyMap[key] : undefined;
                    return (
                      <button
                        key={key}
                        aria-label={
                          key === "⌫" ? "Apagar" : key === "ENTER" ? "Confirmar" : `Letra ${key}`
                        }
                        className={keyClasses(mark, isAction)}
                        onClick={() => handleKey(key)}
                        disabled={guess.isPending}
                        type="button"
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ranking */}
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
                  {item.attempts} tentativa{item.attempts === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>
        ))}

      {/* ── Modal Como Jogar ── */}
      <Dialog open={howToPlayOpen} onOpenChange={setHowToPlayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Como jogar</DialogTitle>

            <DialogDescription className="text-sm pt-1">
              Descubra a palavra certa em 6 tentativas. Depois de cada tentativa, as peças mostram o
              quão perto você está da solução.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm mt-2">
            {/* Exemplo 1: TURMA */}
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <span className="grid h-10 w-10 place-items-center rounded bg-[#21a35d] font-bold text-white">
                  T
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  U
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  R
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  M
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  A
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                A letra <strong className="text-foreground">T</strong> faz parte da palavra e está
                na posição correta.
              </p>
            </div>

            {/* Exemplo 2: VIOLA */}
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  V
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  I
                </span>

                <span className="grid h-10 w-10 place-items-center rounded bg-[#c8a227] font-bold text-white">
                  O
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  L
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  A
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                A letra <strong className="text-foreground">O</strong> faz parte da palavra mas em
                outra posição.
              </p>
            </div>

            {/* Exemplo 3: PULGA */}
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  P
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  U
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  L
                </span>

                <span className="grid h-10 w-10 place-items-center rounded bg-muted font-bold text-muted-foreground">
                  G
                </span>

                <span className="grid h-10 w-10 place-items-center rounded border-2 border-border/60 font-bold">
                  A
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                A letra <strong className="text-foreground">G</strong> não faz parte da palavra.
              </p>
            </div>

            <div className="border-t border-border/60 pt-3 space-y-2 text-xs text-muted-foreground">
              <p>• Os acentos são preenchidos automaticamente, e não são considerados nas dicas.</p>

              <p>• As palavras podem possuir letras repetidas.</p>

              <p>• Uma palavra nova aparece a cada dia.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Estatísticas ── */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Estatísticas</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* 4 indicadores principais */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-2xl font-bold">{stats.played}</p>

                <p className="text-[11px] text-muted-foreground">Jogos</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-2xl font-bold">
                  {stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%
                </p>

                <p className="text-[11px] text-muted-foreground">Vitórias</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-2xl font-bold">{stats.currentStreak}</p>

                <p className="text-[11px] text-muted-foreground">Seq. atual</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-2xl font-bold">{stats.maxStreak}</p>

                <p className="text-[11px] text-muted-foreground">Melhor seq.</p>
              </div>
            </div>

            {/* Gráfico de Distribuição de tentativas */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Distribuição de tentativas
              </h4>

              <div className="space-y-1.5 text-xs font-medium">
                {([1, 2, 3, 4, 5, 6] as const).map((attempt) => {
                  const count = stats.distribution[attempt] || 0;
                  const maxCount = Math.max(1, ...Object.values(stats.distribution));
                  const pct = Math.max(8, (count / maxCount) * 100);
                  const isToday =
                    isFinished && confirmedGuesses.length === attempt && state?.status === "WON";
                  return (
                    <div key={attempt} className="flex items-center gap-2">
                      <span className="w-2 text-right">{attempt}</span>

                      <div className="flex-1">
                        <div
                          className={`flex items-center justify-end px-2 py-1 rounded text-[11px] font-bold text-white transition-all duration-500 ${
                            isToday ? "bg-[#21a35d]" : "bg-muted-foreground/60"
                          }`}
                          style={{ width: `${pct}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botão de compartilhar */}
            {isFinished && (
              <Button className="w-full gap-2" onClick={() => void share()}>
                <Share2 className="h-4 w-4" />
                Compartilhar resultado
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
