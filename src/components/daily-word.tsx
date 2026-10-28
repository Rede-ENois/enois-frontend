import { useCallback, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { WordMark } from "@/types/application/daily-games/word-mark";
import {
  DailyWord as DailyWordView,
  type UserWordStats,
  WORD_LENGTH,
  WORD_MAX_GUESSES,
} from "@rede-enois/design-system/domain";

import { randomUUID } from "@/lib/api-client";
import { dailyWordsApi, previousChallengeDate } from "@/lib/api/daily-games";

// ─── Estatísticas e Persistência Local ─────────────────────────────────────────

const STATS_STORAGE_KEY = "enois_wordle_stats_v1";

function loadWordStats(): UserWordStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // localStorage indisponivel (modo privado): comeca do zero.
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
    // localStorage indisponivel (modo privado): a estatistica fica so na memoria.
  }
  return next;
}

export function DailyWord() {
  const client = useQueryClient();
  const [showPrevious, setShowPrevious] = useState(false);
  const [draft, setDraft] = useState(""); // letras digitadas na linha atual
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [lastConfirmedRow, setLastConfirmedRow] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
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

  const confirmedGuesses = state?.guesses ?? [];

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
    return `Palavras Énois · ${confirmedGuesses.length}/${WORD_MAX_GUESSES}\n\n${lines}`;
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
    <DailyWordView
      loading={today.isPending}
      loadError={today.isError}
      onRetryLoad={() => void today.refetch()}
      canTogglePrevious={previous.data?.status === "IN_PROGRESS" || showPrevious}
      showPrevious={showPrevious}
      onTogglePrevious={() => {
        setShowPrevious(!showPrevious);
        setDraft("");
        setLastConfirmedRow(null);
        setLocalError(null);
      }}
      state={state}
      onStart={() => start.mutate()}
      startPending={start.isPending}
      startError={start.isError}
      draft={draft}
      shakeRow={shakeRow}
      lastConfirmedRow={lastConfirmedRow}
      localError={localError}
      guessPending={guess.isPending}
      onKey={handleKey}
      stats={stats}
      statsOpen={statsOpen}
      onStatsOpenChange={setStatsOpen}
      onShare={() => void share()}
      ranking={{
        loading: ranking.isPending,
        error: ranking.isError,
        onRetry: () => void ranking.refetch(),
        items: ranking.data?.items.map((item) => ({
          ...item,
          href: `/perfil/${item.username}`,
        })),
      }}
    />
  );
}
