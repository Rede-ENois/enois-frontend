// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { LiteModeEffects } from "./lite-mode-effects";

vi.mock("@/lib/use-personalization", () => ({ usePersonalization: () => ({ data: undefined }) }));

describe("LiteModeEffects", () => {
  it("keeps the pre-paint data-lite on mount instead of toggling it off and on", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.setItem("connect-grow-lite-mode", "1");
    const root = document.documentElement;
    root.setAttribute("data-lite", "");
    // Old values per record, not the attribute at callback time: off-then-on in one task reads
    // as "on" again. A `null` old value means the attribute had been removed before.
    const oldValues: (string | null)[] = [];
    const observer = new MutationObserver((records) =>
      oldValues.push(...records.map((record) => record.oldValue)),
    );
    observer.observe(root, { attributeFilter: ["data-lite"], attributeOldValue: true });

    const host = document.createElement("div");
    await act(async () => {
      createRoot(host).render(
        <QueryClientProvider client={new QueryClient()}>
          <LiteModeEffects />
        </QueryClientProvider>,
      );
    });
    await Promise.resolve();
    observer.disconnect();

    expect(oldValues).not.toContain(null);
    expect(root.hasAttribute("data-lite")).toBe(true);
  });

  it("keeps the pre-paint data-batata on mount and turns data-lite on with it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.setItem("connect-grow-lite-mode", "0");
    localStorage.setItem("connect-grow-batata-mode", "1");
    const root = document.documentElement;
    root.setAttribute("data-lite", "");
    root.setAttribute("data-batata", "");
    const oldValues: (string | null)[] = [];
    const observer = new MutationObserver((records) =>
      oldValues.push(...records.map((record) => record.oldValue)),
    );
    observer.observe(root, {
      attributeFilter: ["data-lite", "data-batata"],
      attributeOldValue: true,
    });

    const host = document.createElement("div");
    await act(async () => {
      createRoot(host).render(
        <QueryClientProvider client={new QueryClient()}>
          <LiteModeEffects />
        </QueryClientProvider>,
      );
    });
    await Promise.resolve();
    observer.disconnect();

    // `null` = o atributo chegou a ser removido: no BATATA os dois continuam de pé desde o paint.
    expect(oldValues).not.toContain(null);
    expect(root.hasAttribute("data-batata")).toBe(true);
    expect(root.hasAttribute("data-lite")).toBe(true);
    localStorage.setItem("connect-grow-batata-mode", "0");
  });
});
