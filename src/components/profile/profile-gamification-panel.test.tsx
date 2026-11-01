// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type {
  ProfileGamificationPanelProps as PanelViewProps,
  StreakCardProps,
} from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileGamificationPanel } from "./profile-gamification-panel";

const mocks = vi.hoisted(() => ({
  streak: vi.fn(),
  wallet: vi.fn(),
  card: null as StreakCardProps | null,
  panel: null as PanelViewProps | null,
}));

vi.mock("@/lib/api", () => ({
  streakApi: { me: mocks.streak },
  walletApi: { wallet: mocks.wallet },
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  ProfileGamificationPanel: (props: PanelViewProps) => {
    mocks.panel = props;
    return null;
  },
  gardenStyleOf: (id: string | null | undefined) => (id ? id.replace("garden-", "") : "quintal"),
  StreakCard: (props: StreakCardProps) => {
    mocks.card = props;
    return <section data-streak />;
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const STREAK = {
  currentDays: 4,
  longestDays: 9,
  todayDone: true,
  freezesAvailable: 1,
  lastFrozenDay: null,
};

describe("sequência no perfil", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.card = null;
    mocks.streak.mockResolvedValue(STREAK);
    mocks.wallet.mockResolvedValue({ balance: 0 });
    host = document.createElement("div");
    root = createRoot(host);
  });

  afterEach(() => act(() => root.unmount()));

  const mount = async (isOwner: boolean, profile: object = {}) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <ProfileGamificationPanel profile={profile as never} isOwner={isOwner} postsCount={0} />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  it("o dono vê o cartão completo com o objeto da API e o dia de hoje", async () => {
    await mount(true);

    expect(mocks.card?.variant).toBeUndefined();
    expect(mocks.card?.streak).toEqual(STREAK);
    expect(mocks.card?.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(mocks.card?.loading).toBe(false);
  });

  it("falha ao carregar vira erro com nova tentativa", async () => {
    mocks.streak.mockRejectedValue(new Error("offline"));
    await mount(true);

    expect(mocks.card?.error).toBe(true);
    expect(mocks.card?.onRetry).toBeTypeOf("function");
  });

  it("visitante nunca vê nem busca a sequência", async () => {
    await mount(false);

    expect(host.querySelector("[data-streak]")).toBeNull();
    expect(mocks.streak).not.toHaveBeenCalled();
  });

  it("passes the reputation garden and the equipped style to the panel", async () => {
    const garden = { trajectory: 2, relations: 1, contribution: 0, tenure: 3, health: 2 };
    await mount(false, { garden, gardenStyle: "garden-cerrado" });

    expect(mocks.panel?.garden).toEqual(garden);
    expect(mocks.panel?.gardenStyle).toBe("cerrado");
  });
});
