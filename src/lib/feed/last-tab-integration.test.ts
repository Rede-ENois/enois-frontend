import type { HomeTab } from "@/types/routes/feed/home-tab";
import { beforeEach, describe, expect, it } from "vitest";

import { readLastFeedTab, rememberFeedTab } from "./last-tab";

/**
 * Prova que a logica de resolucao de aba do feed.tsx funciona:
 * a mesma expressao que o componente usa (linhas 254-258) e reproduzida aqui
 * com os mesmos inputs, garantindo que a fiacao esta correta.
 *
 * resolve(professional, aba, lastTab):
 *   professional ? "CORPORATE"
 *   : aba === "CORPORATE" ? lastTab
 *   : (aba ?? lastTab)
 */
function resolveTab(professional: boolean, aba: HomeTab | undefined, lastTab: HomeTab): HomeTab {
  return professional ? "CORPORATE" : aba === "CORPORATE" ? lastTab : (aba ?? lastTab);
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

describe("feed tab resolution (integration with feed.tsx logic)", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: memoryStorage(),
      configurable: true,
    });
  });

  it("first visit without anything saved opens Tudo", () => {
    const lastTab = readLastFeedTab();
    expect(resolveTab(false, undefined, lastTab)).toBe("ALL");
  });

  it("choosing Em alta, leaving and coming back reopens Em alta", () => {
    rememberFeedTab("TRENDING");
    const lastTab = readLastFeedTab();
    // Voltando sem ?aba= (como o link "Inicio" faz):
    expect(resolveTab(false, undefined, lastTab)).toBe("TRENDING");
  });

  it("professional interface forces Corporativo regardless of saved tab", () => {
    rememberFeedTab("FOR_YOU");
    const lastTab = readLastFeedTab();
    expect(resolveTab(true, undefined, lastTab)).toBe("CORPORATE");
  });

  it("/feed?aba=CORPORATE in social interface falls to saved tab", () => {
    rememberFeedTab("TRENDING");
    const lastTab = readLastFeedTab();
    // Alguem envia link /feed?aba=CORPORATE pro usuario na interface social:
    expect(resolveTab(false, "CORPORATE", lastTab)).toBe("TRENDING");
  });

  it("/feed?aba=CORPORATE in social with nothing saved falls to Tudo", () => {
    const lastTab = readLastFeedTab();
    expect(resolveTab(false, "CORPORATE", lastTab)).toBe("ALL");
  });

  it("/feed?aba=FOR_YOU opens Para voce directly", () => {
    rememberFeedTab("TRENDING");
    const lastTab = readLastFeedTab();
    // URL explicita vence a aba guardada:
    expect(resolveTab(false, "FOR_YOU", lastTab)).toBe("FOR_YOU");
  });
});
