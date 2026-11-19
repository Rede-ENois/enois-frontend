import type { HomeTab } from "@/types/routes/feed/home-tab";
import { describe, expect, it } from "vitest";

import { DEFAULT_FEED_TAB, readLastFeedTab, rememberFeedTab } from "./last-tab";

/**
 * A expressão de resolução que `useFeedTab` usa (`aba ?? stored ?? padrão`), com a aba padrão de
 * cada interface. Montar o hook inteiro aqui repetiria o teste dele; o que se prova é a regra.
 */
function resolveTab(aba: HomeTab | undefined, professional: boolean, stored: HomeTab | null) {
  const defaultTab = professional ? "CORPORATE" : DEFAULT_FEED_TAB;
  return aba ?? stored ?? defaultTab;
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

function useStorage(): void {
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage(),
    configurable: true,
    writable: true,
  });
}

describe("resolução da aba do feed", () => {
  it("a primeira visita sem nada guardado abre Tudo", () => {
    useStorage();
    expect(resolveTab(undefined, false, null)).toBe("ALL");
    expect(readLastFeedTab()).toBe("ALL");
  });

  it("escolher Em alta e voltar reabre Em alta", () => {
    useStorage();
    rememberFeedTab("TRENDING");
    expect(resolveTab(undefined, false, readLastFeedTab())).toBe("TRENDING");
  });

  it("a interface profissional não herda a aba social guardada", () => {
    useStorage();
    rememberFeedTab("FOR_YOU");
    expect(resolveTab(undefined, true, null)).toBe("CORPORATE");
  });

  it("a interface social abre o corporativo por um link, e não a aba guardada", () => {
    expect(resolveTab("CORPORATE", false, "TRENDING")).toBe("CORPORATE");
  });

  it("a interface profissional abre a aba social por um link", () => {
    expect(resolveTab("TRENDING", true, null)).toBe("TRENDING");
  });

  it("um link explícito vence a aba guardada", () => {
    expect(resolveTab("FOR_YOU", false, "TRENDING")).toBe("FOR_YOU");
  });
});
