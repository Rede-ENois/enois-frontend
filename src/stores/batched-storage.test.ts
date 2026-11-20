import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  STORAGE_WRITE_DELAY_MS,
  flushStorageWrites,
  readPending,
  writeStorageLater,
} from "./batched-storage";

describe("batched-storage", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new Map();
    vi.stubGlobal("window", { addEventListener: vi.fn() });
    vi.stubGlobal("document", { addEventListener: vi.fn(), visibilityState: "visible" });
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
  });

  afterEach(() => {
    flushStorageWrites();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("agrupa N sets em uma unica gravacao no disco", () => {
    writeStorageLater("a", "1");
    writeStorageLater("a", "2");
    writeStorageLater("a", "3");

    expect(store.has("a")).toBe(false);
    vi.advanceTimersByTime(STORAGE_WRITE_DELAY_MS);
    expect(store.get("a")).toBe("3");
  });

  it("grava varias chaves juntas no flush", () => {
    writeStorageLater("x", "10");
    writeStorageLater("y", "20");

    vi.advanceTimersByTime(STORAGE_WRITE_DELAY_MS);
    expect(store.get("x")).toBe("10");
    expect(store.get("y")).toBe("20");
  });

  it("flushStorageWrites grava sem esperar o timer", () => {
    writeStorageLater("k", "v");
    expect(store.has("k")).toBe(false);

    flushStorageWrites();
    expect(store.get("k")).toBe("v");
  });

  it("writeStorageLater com null remove a chave no flush", () => {
    store.set("k", "old");
    writeStorageLater("k", null);

    vi.advanceTimersByTime(STORAGE_WRITE_DELAY_MS);
    expect(store.has("k")).toBe(false);
  });

  it("set pendente seguido de remove termina removido", () => {
    writeStorageLater("k", "value");
    writeStorageLater("k", null);

    vi.advanceTimersByTime(STORAGE_WRITE_DELAY_MS);
    expect(store.has("k")).toBe(false);
  });

  it("remove pendente seguido de set termina com o valor novo", () => {
    store.set("k", "old");
    writeStorageLater("k", null);
    writeStorageLater("k", "new");

    vi.advanceTimersByTime(STORAGE_WRITE_DELAY_MS);
    expect(store.get("k")).toBe("new");
  });

  it("readPending retorna o valor pendente", () => {
    expect(readPending("k")).toBeUndefined();

    writeStorageLater("k", "v");
    expect(readPending("k")).toEqual({ value: "v" });

    writeStorageLater("k", null);
    expect(readPending("k")).toEqual({ value: null });

    flushStorageWrites();
    expect(readPending("k")).toBeUndefined();
  });

  it("reinicia o timer a cada writeStorageLater", () => {
    writeStorageLater("a", "1");
    vi.advanceTimersByTime(200);
    writeStorageLater("a", "2");
    vi.advanceTimersByTime(200);

    expect(store.has("a")).toBe(false);

    vi.advanceTimersByTime(50);
    expect(store.get("a")).toBe("2");
  });
});
