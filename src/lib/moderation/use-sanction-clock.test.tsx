// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSanctionClock } from "./use-sanction-clock";

let root: Root;
let host: HTMLDivElement;
const refresh = vi.fn();
const serverNow = "2026-01-01T12:00:00Z";

function Clock({
  timestamp = serverNow,
  deadlines = [],
  observedAt,
}: {
  timestamp?: string;
  deadlines?: string[];
  observedAt?: number;
}) {
  const now = useSanctionClock(timestamp, deadlines, refresh, observedAt);
  return <output>{now}</output>;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  refresh.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("relógio de penalidades sincronizado com o servidor", () => {
  it("preserva o tempo decorrido ao remontar com a mesma resposta em cache", async () => {
    await act(async () => root.render(<Clock observedAt={0} />));
    expect(host.textContent).toBe("1767268800000");
    await act(async () => root.render(null));
    await act(async () => vi.advanceTimersByTime(20_000));
    await act(async () => root.render(<Clock observedAt={0} />));
    expect(host.textContent).toBe("1767268820000");
  });
  it("avança pelo tempo decorrido sem depender da hora configurada no computador", async () => {
    await act(async () => root.render(<Clock />));
    expect(host.textContent).toBe("1767268800000");
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(host.textContent).toBe("1767268860000");
  });

  it("revalida uma única vez ao atingir o prazo, sem decidir o desfecho", async () => {
    await act(async () => root.render(<Clock deadlines={["2026-01-01T12:01:00Z"]} />));
    await act(async () => vi.advanceTimersByTime(59_000));
    expect(refresh).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(120_000));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(host.textContent).not.toMatch(/liberada|banida/);
  });

  it("não entra em ciclo de consultas quando o servidor mantém um prazo já encerrado", async () => {
    await act(async () => root.render(<Clock deadlines={["2026-01-01T11:00:00Z"]} />));
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () =>
      root.render(<Clock timestamp="2026-01-01T12:02:00Z" deadlines={["2026-01-01T11:00:00Z"]} />),
    );
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reancora o relógio quando chega uma nova referência do servidor", async () => {
    await act(async () => root.render(<Clock />));
    await act(async () => vi.advanceTimersByTime(60_000));
    await act(async () => root.render(<Clock timestamp="2026-01-01T12:03:00Z" />));
    expect(host.textContent).toBe("1767268980000");
  });

  it.each(["", "horário inválido"])(
    "não inventa um relógio quando a referência é %s",
    async (timestamp) => {
      await act(async () => root.render(<Clock timestamp={timestamp} />));
      expect(host.textContent).toBe("");
      expect(vi.getTimerCount()).toBe(0);
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  it("consulta o estado ao retomar uma aba visível", async () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await act(async () => root.render(<Clock />));
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(refresh).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(refresh).toHaveBeenCalledTimes(1);
    visibility.mockRestore();
  });

  it("remove temporizador e ouvintes quando a tela é desmontada", async () => {
    await act(async () => root.render(<Clock />));
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => root.render(null));
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(refresh).not.toHaveBeenCalled();
  });
});
