import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePreferencesStore } from "./preferences.store";

// O store resolve o storage na importação: o stub precisa existir antes do módulo carregar.
vi.hoisted(() => {
  const valores = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => valores.get(key) ?? null,
    setItem: (key: string, value: string) => valores.set(key, value),
    removeItem: (key: string) => valores.delete(key),
  });
});

/**
 * A preferência de revelar mídia sensível vive no mesmo storage dos temas: o arquivo é
 * editável à mão e sobrevive a versões antigas, então nada do que veio dele pode ser
 * confiável — qualquer coisa que não seja `true` volta ao padrão (velada).
 */
describe("store de preferências", () => {
  beforeEach(() => {
    const valores = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => valores.get(key) ?? null,
      setItem: (key: string, value: string) => valores.set(key, value),
      removeItem: (key: string) => valores.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reidrata a preferência de revelar mídia sensível salva como verdadeiro", async () => {
    // O setState grava no storage (middleware de persistência): semear depois dele,
    // senão a gravação do próprio estado apaga o valor montado para o teste.
    usePreferencesStore.setState({ revealSensitiveMedia: false });
    localStorage.setItem(
      "connect-grow-preferences",
      JSON.stringify({ state: { revealSensitiveMedia: true }, version: 0 }),
    );

    await usePreferencesStore.persist.rehydrate();

    expect(usePreferencesStore.getState().revealSensitiveMedia).toBe(true);
  });

  it("volta ao padrão (velada) quando o valor salvo não é booleano", async () => {
    usePreferencesStore.setState({ revealSensitiveMedia: true });
    localStorage.setItem(
      "connect-grow-preferences",
      JSON.stringify({ state: { revealSensitiveMedia: "sim" }, version: 0 }),
    );

    await usePreferencesStore.persist.rehydrate();

    expect(usePreferencesStore.getState().revealSensitiveMedia).toBe(false);
  });

  it("persiste a preferência no storage quando alternada", () => {
    usePreferencesStore.setState({ revealSensitiveMedia: false });

    usePreferencesStore.getState().setRevealSensitiveMedia(true);

    const salvo = JSON.parse(localStorage.getItem("connect-grow-preferences") ?? "{}") as {
      state?: { revealSensitiveMedia?: boolean };
    };
    expect(salvo.state?.revealSensitiveMedia).toBe(true);
  });
});
