import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_FEED_TAB, readLastFeedTab, rememberFeedTab } from "./last-tab";

const KEY = "connect-grow-last-feed-tab";

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

describe("last feed tab", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: memoryStorage(),
      configurable: true,
    });
  });

  it("falls back to Tudo when nothing was saved", () => {
    expect(DEFAULT_FEED_TAB).toBe("ALL");
    expect(readLastFeedTab()).toBe("ALL");
  });

  it("reopens on the last tab chosen", () => {
    rememberFeedTab("FOR_YOU");
    expect(readLastFeedTab()).toBe("FOR_YOU");
    rememberFeedTab("TRENDING");
    expect(readLastFeedTab()).toBe("TRENDING");
  });

  it("ignores a saved value the feed no longer offers", () => {
    localStorage.setItem(KEY, "ANTIGA");
    expect(readLastFeedTab()).toBe("ALL");
  });

  it("never saves the corporate tab, which the interface forces", () => {
    rememberFeedTab("FOR_YOU");
    rememberFeedTab("CORPORATE");
    expect(readLastFeedTab()).toBe("FOR_YOU");
  });

  it("falls back to Tudo when the storage throws", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
      configurable: true,
    });
    expect(() => rememberFeedTab("FOR_YOU")).not.toThrow();
    expect(readLastFeedTab()).toBe("ALL");
  });
});
