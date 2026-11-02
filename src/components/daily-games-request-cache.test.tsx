// @vitest-environment jsdom
import { type ComponentProps, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MazeState } from "@/types/application/daily-games/maze-state";
import type { WordState } from "@/types/application/daily-games/word-state";
import type { DailyMaze as MazeView, DailyWord as WordView } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DailyMaze } from "./daily-maze";
import { DailyWord } from "./daily-word";

const mocks = vi.hoisted(() => ({
  maze: {} as ComponentProps<typeof MazeView>,
  words: {} as ComponentProps<typeof WordView>,
  move: vi.fn(),
  guess: vi.fn(),
  start: vi.fn(),
}));

vi.mock("@rede-enois/design-system/domain", () => ({
  DailyMaze: (props: ComponentProps<typeof MazeView>) => {
    mocks.maze = props;
    return null;
  },
  DailyWord: (props: ComponentProps<typeof WordView>) => {
    mocks.words = props;
    return null;
  },
  WORD_LENGTH: 5,
}));
vi.mock("@/lib/api-client", () => ({ api: {}, randomUUID: () => crypto.randomUUID() }));
vi.mock("@/lib/daily-share", () => ({
  dailyDateLabel: (date: string) => date,
  useDailyShare: () => ({ share: vi.fn(), status: "idle" }),
}));
vi.mock("@/lib/api/daily-games", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/daily-games")>()),
  dailyMazeApi: {
    move: mocks.move,
    start: mocks.start,
    today: () => Promise.reject(new Error("Unexpected challenge date")),
    leaderboard: () => Promise.resolve({ items: [] }),
  },
  dailyWordsApi: {
    guess: mocks.guess,
    start: mocks.start,
    today: () => Promise.reject(new Error("Unexpected challenge date")),
    leaderboard: () => Promise.resolve({ items: [] }),
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, refuse) => {
    resolve = accept;
    reject = refuse;
  });
  return { promise, resolve, reject };
}

const TODAY = "2026-11-01";
const PREVIOUS = "2026-10-31";
const mazeState = (date: string): MazeState => ({
  date,
  status: "IN_PROGRESS",
  passages: [],
  position: 0,
  moves: 0,
  startedAt: `${date}T12:00:00Z`,
  completedAt: null,
});
const wordState = (date: string): WordState => ({
  date,
  status: "IN_PROGRESS",
  guesses: [],
  streak: 0,
});
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe("daily game responses keep their original challenge", () => {
  let client: QueryClient;
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.move.mockReset();
    mocks.guess.mockReset();
    mocks.start.mockReset();
    localStorage.clear();
    client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false }, mutations: { retry: false } },
    });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  for (const game of ["maze", "words"] as const) {
    const todayKey = ["daily-games", game, "today"];
    const previousKey = ["daily-games", game, "previous", PREVIOUS];
    const initial = game === "maze" ? mazeState : wordState;
    const response = game === "maze"
      ? { ...mazeState(TODAY), position: 1, moves: 1 }
      : { ...wordState(TODAY), guesses: [{ word: "TERMO", marks: Array.from({ length: 5 }, () => "ABSENT" as const) }] };

    const render = async (notStarted = false) => {
      client.setQueryData(todayKey, { ...initial(TODAY), ...(notStarted ? { status: "NOT_STARTED" } : {}) });
      client.setQueryData(previousKey, initial(PREVIOUS));
      client.setQueryData(["daily-games", game, "leaderboard"], { items: [] });
      await act(async () => root.render(
        <QueryClientProvider client={client}>
          {game === "maze" ? <DailyMaze /> : <DailyWord />}
        </QueryClientProvider>,
      ));
    };

    const submit = async () => {
      if (game === "maze") await act(async () => mocks.maze.onMove("RIGHT"));
      else {
        for (const letter of "TERMO") await act(async () => mocks.words.onKey(letter));
        await act(async () => mocks.words.onKey("ENTER"));
      }
      await settle();
    };

    for (const fromPrevious of [false, true]) {
      for (const switchDay of [false, true]) {
        it(`${game}: submits from ${fromPrevious ? "yesterday" : "today"}, switch=${switchDay}`, async () => {
          const pending = deferred<MazeState | WordState>();
          const request = game === "maze" ? mocks.move : mocks.guess;
          request.mockReturnValue(pending.promise);
          await render();
          if (fromPrevious) await act(async () => mocks[game].onTogglePrevious());
          await submit();
          expect(request).toHaveBeenCalledTimes(1);
          expect(request.mock.calls[0][2]).toBe(fromPrevious ? PREVIOUS : undefined);
          expect(game === "maze" ? mocks.maze.movePending : mocks.words.guessPending).toBe(true);
          if (switchDay) await act(async () => mocks[game].onTogglePrevious());
          const result = { ...response, date: fromPrevious ? PREVIOUS : TODAY };
          await act(async () => pending.resolve(result));
          await settle();
          expect(client.getQueryData(fromPrevious ? previousKey : todayKey)).toEqual(result);
          expect(client.getQueryData(fromPrevious ? todayKey : previousKey)).toEqual(initial(fromPrevious ? TODAY : PREVIOUS));
          expect(mocks[game].state?.date).toBe((fromPrevious !== switchDay) ? PREVIOUS : TODAY);
          if (game === "words") expect(mocks.words.lastConfirmedRow).toBe(switchDay ? null : 0);
        });
      }
    }

    it(`${game}: starting today while switching to yesterday only updates today`, async () => {
      const pending = deferred<MazeState | WordState>();
      mocks.start.mockReturnValue(pending.promise);
      await render(true);
      await act(async () => mocks[game].onStart());
      await settle();
      await act(async () => mocks[game].onTogglePrevious());
      await act(async () => pending.resolve(initial(TODAY)));
      await settle();
      expect(client.getQueryData(todayKey)).toEqual(initial(TODAY));
      expect(client.getQueryData(previousKey)).toEqual(initial(PREVIOUS));
      expect(mocks[game].state?.date).toBe(PREVIOUS);
    });
  }

  it("a rejected word guess does not mark an error on the other challenge", async () => {
    client.setQueryData(["daily-games", "words", "today"], wordState(TODAY));
    client.setQueryData(["daily-games", "words", "previous", PREVIOUS], wordState(PREVIOUS));
    client.setQueryData(["daily-games", "words", "leaderboard"], { items: [] });
    const pending = deferred<WordState>();
    mocks.guess.mockReturnValue(pending.promise);
    await act(async () => root.render(<QueryClientProvider client={client}><DailyWord /></QueryClientProvider>));
    for (const letter of "TERMO") await act(async () => mocks.words.onKey(letter));
    await act(async () => mocks.words.onKey("ENTER"));
    await settle();
    await act(async () => mocks.words.onTogglePrevious());
    await act(async () => pending.reject(new Error("INVALID_GUESS")));
    await settle();
    expect(mocks.words.localError).toBeNull();
    expect(mocks.words.shakeRow).toBeNull();
    expect(mocks.words.state?.date).toBe(PREVIOUS);
  });
});
