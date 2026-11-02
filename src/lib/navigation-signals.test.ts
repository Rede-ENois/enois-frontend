import type { NavigationCounts } from "@/types/navigation/navigation-counts";
import { describe, expect, it } from "vitest";

import { signalFor } from "./navigation-signals";

const counts = (overrides: Partial<NavigationCounts> = {}): NavigationCounts => ({
  summary: { total: 6, byModule: { MESSAGES: 2, GROUPS: 1, DAILY_GAMES: 1, OTHER: 2 } },
  unreadMessages: 3,
  pendingRequests: 2,
  ...overrides,
});

describe("signalFor", () => {
  it("counts messages in a balloon and requests in a pill", () => {
    expect(signalFor({ href: "/mensagens" }, counts())).toEqual({ kind: "messages", count: 3 });
    expect(signalFor({ href: "/rede" }, counts())).toEqual({ kind: "count", count: 2 });
  });

  it("counts notices without the messages, which have their own balloon", () => {
    expect(signalFor({ href: "/notificacoes" }, counts())).toEqual({ kind: "count", count: 4 });
  });

  it("lights a dot where the area has unread news, and nothing elsewhere", () => {
    expect(signalFor({ href: "/grupos", notifies: "GROUPS" }, counts())).toEqual({ kind: "new" });
    expect(signalFor({ href: "/eventos", notifies: "EVENTS" }, counts())).toBeNull();
    expect(signalFor({ href: "/salvos" }, counts())).toBeNull();
  });

  it("lights Explore for the rooms that live there", () => {
    expect(signalFor({ href: "/explorar" }, counts())).toEqual({ kind: "new" });
    expect(
      signalFor({ href: "/explorar" }, counts({ summary: { total: 0, byModule: {} } })),
    ).toBeNull();
  });

  it("stays quiet before the counts arrive", () => {
    const empty = counts({ summary: undefined, unreadMessages: 0, pendingRequests: 0 });
    for (const href of ["/mensagens", "/rede", "/notificacoes", "/explorar"]) {
      expect(signalFor({ href }, empty)).toBeNull();
    }
  });
});
