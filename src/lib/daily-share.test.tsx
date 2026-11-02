// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DAILY_SHARE_URL, dailyDateLabel, useDailyShare } from "./daily-share";

const RESULT = { game: "maze", dateLabel: "30/10", moves: 12, elapsedMillis: 65_000 } as const;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("compartilhar o jogo diário", () => {
  let root: Root;
  let hook: ReturnType<typeof useDailyShare>;

  function Probe() {
    hook = useDailyShare();
    return null;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    root = createRoot(document.createElement("div"));
    act(() => root.render(<Probe />));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, "share");
    Reflect.deleteProperty(navigator, "clipboard");
  });

  const stub = (name: "share" | "clipboard", value: unknown) =>
    Object.defineProperty(navigator, name, { value, configurable: true });

  const run = () => act(async () => hook.share(RESULT));

  it("usa o menu nativo com o texto e o link, e volta ao normal depois", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stub("share", share);
    await run();

    expect(share.mock.calls[0][0].text).toContain(DAILY_SHARE_URL);
    expect(hook.status).toBe("shared");
    act(() => vi.advanceTimersByTime(3000));
    expect(hook.status).toBe("idle");
  });

  it("sem menu nativo, copia", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stub("clipboard", { writeText });
    await run();

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(DAILY_SHARE_URL));
    expect(hook.status).toBe("copied");
  });

  it("fechar o menu nativo não é erro", async () => {
    stub("share", vi.fn().mockRejectedValue(new DOMException("cancel", "AbortError")));
    await run();

    expect(hook.status).toBe("idle");
  });

  it("falha de verdade vira erro", async () => {
    stub("share", vi.fn().mockRejectedValue(new DOMException("nope", "NotAllowedError")));
    await run();
    expect(hook.status).toBe("error");

    Reflect.deleteProperty(navigator, "share");
    stub("clipboard", { writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    await run();
    expect(hook.status).toBe("error");
  });
});

describe("rótulo da data", () => {
  it("mostra dia/mês", () => {
    expect(dailyDateLabel("2026-10-30")).toBe("30/10");
  });
});
