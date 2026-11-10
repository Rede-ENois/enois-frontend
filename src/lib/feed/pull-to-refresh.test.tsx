// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFeedPullToRefresh } from "./pull-to-refresh";

/** Simula o gesto de puxar: sequência de eventos de toque no window. */
function pull(distance: number) {
  const touch = { clientX: 10, clientY: 0 };
  window.dispatchEvent(
    new TouchEvent("touchstart", { touches: [{ ...touch, clientY: 0 }] as unknown as Touch[] }),
  );
  window.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [{ ...touch, clientY: distance }] as unknown as Touch[],
    }),
  );
  window.dispatchEvent(new TouchEvent("touchend", { touches: [] as unknown as Touch[] }));
}

function swipeHorizontally(distance: number) {
  const touch = { clientY: 0 };
  window.dispatchEvent(
    new TouchEvent("touchstart", { touches: [{ ...touch, clientX: 0 }] as unknown as Touch[] }),
  );
  window.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [{ ...touch, clientX: distance }] as unknown as Touch[],
    }),
  );
  window.dispatchEvent(new TouchEvent("touchend", { touches: [] as unknown as Touch[] }));
}

describe("useFeedPullToRefresh", () => {
  let root: Root;
  let host: HTMLDivElement;
  let probe: ReturnType<typeof useFeedPullToRefresh>;
  let refresh: () => void = () => {};

  function Harness({ fetching }: { fetching: boolean }) {
    probe = useFeedPullToRefresh(refresh, fetching);
    return null;
  }

  const mount = async (fetching = false) => {
    refresh = vi.fn();
    await act(async () => root.render(<Harness fetching={fetching} />));
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  it("renova quando a puxada passa do limite e solta", async () => {
    await mount();
    await act(async () => pull(90));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("puxada curta não renova", async () => {
    await mount();
    await act(async () => pull(30));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("swipe horizontal não é puxada", async () => {
    await mount();
    await act(async () => swipeHorizontally(120));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("não renova duas vezes no mesmo gesto", async () => {
    await mount();
    const touch = { clientX: 10, clientY: 0 };
    await act(async () => {
      window.dispatchEvent(
        new TouchEvent("touchstart", { touches: [{ ...touch, clientY: 0 }] as unknown as Touch[] }),
      );
      window.dispatchEvent(
        new TouchEvent("touchmove", { touches: [{ ...touch, clientY: 90 }] as unknown as Touch[] }),
      );
      window.dispatchEvent(
        new TouchEvent("touchmove", {
          touches: [{ ...touch, clientY: 140 }] as unknown as Touch[],
        }),
      );
      window.dispatchEvent(new TouchEvent("touchend", { touches: [] as unknown as Touch[] }));
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("enquanto uma renovação está em curso, o gesto não pede outra", async () => {
    await mount(true);
    await act(async () => pull(90));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("rolado para baixo, a puxada não parte do topo e não renova", async () => {
    await mount();
    Object.defineProperty(window, "scrollY", { value: 400, configurable: true, writable: true });
    await act(async () => pull(90));
    expect(refresh).not.toHaveBeenCalled();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
  });
});
