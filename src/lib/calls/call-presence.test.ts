// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { PRESENCE_PING_INTERVAL_MS, startPresencePing } from "./call-presence";

describe("sinal de vida da sala", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pinga em intervalo fixo enquanto a sala está aberta, e para quando o chamador para", async () => {
    vi.useFakeTimers();
    const ping = vi.fn<(callId: string) => Promise<unknown>>().mockResolvedValue(undefined);
    const stop = startPresencePing("call-1", ping);

    expect(ping).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(PRESENCE_PING_INTERVAL_MS);
    expect(ping).toHaveBeenCalledWith("call-1");
    await vi.advanceTimersByTimeAsync(PRESENCE_PING_INTERVAL_MS * 2);
    expect(ping).toHaveBeenCalledTimes(3);

    stop();
    await vi.advanceTimersByTimeAsync(PRESENCE_PING_INTERVAL_MS * 3);
    expect(ping).toHaveBeenCalledTimes(3);
  });

  it("falha de ping é silenciosa e o intervalo segue", async () => {
    vi.useFakeTimers();
    const ping = vi.fn<(callId: string) => Promise<unknown>>().mockRejectedValue(new Error("rede"));
    const stop = startPresencePing("call-1", ping);

    await vi.advanceTimersByTimeAsync(PRESENCE_PING_INTERVAL_MS * 2);
    expect(ping).toHaveBeenCalledTimes(2);
    stop();
  });
});
