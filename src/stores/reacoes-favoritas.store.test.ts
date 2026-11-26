import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAVORITAS_MAX, FAVORITAS_PADRAO } from "@/lib/reactions/favoritas";

import { hidratarReacoesFavoritas, useReacoesFavoritasStore } from "./reacoes-favoritas.store";

/**
 * O store resolve `window.localStorage` na importação, num ambiente sem DOM: o falso precisa
 * existir antes de o módulo carregar, e as asserções leem o mesmo mapinha.
 */
const falso = vi.hoisted(() => {
  const valores = new Map<string, string>();
  const armazenamento = {
    getItem: (chave: string) => valores.get(chave) ?? null,
    setItem: (chave: string, valor: string) => {
      valores.set(chave, valor);
    },
    removeItem: (chave: string) => {
      valores.delete(chave);
    },
  };
  // O middleware lê `localStorage` solto quando não há `window`.
  vi.stubGlobal("localStorage", armazenamento);
  vi.stubGlobal("window", { localStorage: armazenamento });
  return { armazenamento };
});

const CHAVE = "enois-reacoes-favoritas";

function semear(valor: unknown): void {
  falso.armazenamento.setItem(CHAVE, JSON.stringify({ state: valor, version: 0 }));
}

/**
 * A fileira vive no navegador e sobrevive a versões antigas: nada do que veio do arquivo pode
 * derrubar o seletor, e o toque numa reação nova sempre sai daqui.
 */
describe("store de reações favoritas", () => {
  beforeEach(() => {
    falso.armazenamento.removeItem(CHAVE);
    useReacoesFavoritasStore.setState({ favoritas: [...FAVORITAS_PADRAO], escolheu: false });
  });

  // `vi.unstubAllGlobals` tiraria o storage que o store já resolveu: o vício do arquivo é do teste.
  afterEach(() => falso.armazenamento.removeItem(CHAVE));

  it("nasce com o padrão e sem escolha", () => {
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(FAVORITAS_PADRAO);
    expect(useReacoesFavoritasStore.getState().escolheu).toBe(false);
  });

  it("traz a fileira guardada na ordem em que foi salva", async () => {
    semear({ favoritas: ["LAUGH", "LIKE"], escolheu: true });
    await hidratarReacoesFavoritas();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LAUGH", "LIKE"]);
    expect(useReacoesFavoritasStore.getState().escolheu).toBe(true);
  });

  it("descarta repetida, código estranho e o que passa do limite", async () => {
    semear({
      favoritas: ["LIKE", "LIKE", "curtida", "/x.svg", "LOVE", "LAUGH", "ROFL", "WOW", "SAD"],
      escolheu: true,
    });
    await hidratarReacoesFavoritas();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual([
      "LIKE",
      "LOVE",
      "LAUGH",
      "ROFL",
      "WOW",
    ]);
    expect(useReacoesFavoritasStore.getState().favoritas).toHaveLength(FAVORITAS_MAX);
  });

  it("lista vazia ou sem forma volta ao padrão e a ninguém escolheu", async () => {
    for (const valor of [{ favoritas: [], escolheu: false }, { favoritas: "LIKE" }, null]) {
      useReacoesFavoritasStore.setState({ favoritas: [...FAVORITAS_PADRAO], escolheu: false });
      semear(valor);
      await hidratarReacoesFavoritas();
      expect(useReacoesFavoritasStore.getState().favoritas).toEqual(FAVORITAS_PADRAO);
      expect(useReacoesFavoritasStore.getState().escolheu).toBe(false);
    }
  });

  it("folga é escolher: põe no fim, tira e marca a escolha", () => {
    useReacoesFavoritasStore.getState().alternar("LOVE");
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LIKE", "HEART_PURPLE", "LOVE"]);
    expect(useReacoesFavoritasStore.getState().escolheu).toBe(true);
    useReacoesFavoritasStore.getState().alternar("LIKE");
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["HEART_PURPLE", "LOVE"]);
  });

  it("alternar na fileira cheia não põe a reação nova", () => {
    useReacoesFavoritasStore.setState({
      favoritas: ["A1", "A2", "A3", "A4", "A5"],
      escolheu: true,
    });
    useReacoesFavoritasStore.getState().alternar("NOVA");
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["A1", "A2", "A3", "A4", "A5"]);
  });

  it("mover troca a reação de casa", () => {
    useReacoesFavoritasStore.getState().mover("HEART_PURPLE", -1);
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["HEART_PURPLE", "LIKE"]);
  });

  it("grava a escolha no navegador", () => {
    useReacoesFavoritasStore.getState().alternar("LOVE");
    expect(JSON.parse(falso.armazenamento.getItem(CHAVE) ?? "{}")).toMatchObject({
      state: { favoritas: ["LIKE", "HEART_PURPLE", "LOVE"], escolheu: true },
    });
  });
});
