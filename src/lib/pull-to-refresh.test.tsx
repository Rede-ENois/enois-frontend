// @vitest-environment jsdom
import { type RefObject, act, createRef } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePullToRefresh } from "./pull-to-refresh";

/** Simula o gesto de puxar: sequencia de eventos de toque, com o mesmo borbulhar do navegador. */
function pull(distance: number, target: EventTarget = window) {
  const touch = { clientX: 10, clientY: 0 };
  const send = (type: string, y: number) =>
    target.dispatchEvent(
      new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches: [{ ...touch, clientY: y }] as unknown as Touch[],
      }),
    );
  send("touchstart", 0);
  send("touchmove", distance);
  send("touchend", distance);
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

describe("usePullToRefresh", () => {
  let root: Root;
  let host: HTMLDivElement;
  let refresh: () => void = () => {};

  function Harness({ fetching }: { fetching: boolean }) {
    usePullToRefresh(refresh, fetching);
    return null;
  }

  function ContainerHarness({ listRef }: { listRef: RefObject<HTMLUListElement | null> }) {
    usePullToRefresh(refresh, false, listRef);
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

  it("puxada curta nao renova", async () => {
    await mount();
    await act(async () => pull(30));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("swipe horizontal nao e puxada", async () => {
    await mount();
    await act(async () => swipeHorizontally(120));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("nao renova duas vezes no mesmo gesto", async () => {
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

  it("enquanto uma renovacao esta em curso, o gesto nao pede outra", async () => {
    await mount(true);
    await act(async () => pull(90));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("rolado para baixo, a puxada nao parte do topo e nao renova", async () => {
    await mount();
    Object.defineProperty(window, "scrollY", { value: 400, configurable: true, writable: true });
    await act(async () => pull(90));
    expect(refresh).not.toHaveBeenCalled();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
  });

  it("com contêiner, o topo e o scrollTop dele e o gesto precisa comecar nele", async () => {
    const listRef = createRef<HTMLUListElement>();
    refresh = vi.fn();
    await act(async () => root.render(<ContainerHarness listRef={listRef} />));

    const list = document.createElement("ul");
    document.body.append(list);
    list.scrollTop = 0;
    listRef.current = list;

    // Gesto começando FORA da lista (na janela) não renova: com o contêiner de rolagem
    // interno, a página fica em scrollY 0 e só o gesto que começa na lista conta.
    await act(async () => pull(90, window));
    expect(refresh).not.toHaveBeenCalled();

    await act(async () => pull(90, list));
    expect(refresh).toHaveBeenCalledTimes(1);
    list.remove();
  });

  it("com contêiner ja rolado, o gesto nao renova", async () => {
    const listRef = createRef<HTMLUListElement>();
    refresh = vi.fn();
    await act(async () => root.render(<ContainerHarness listRef={listRef} />));

    const list = document.createElement("ul");
    document.body.append(list);
    list.scrollTop = 200;
    listRef.current = list;

    await act(async () => pull(90, list));
    expect(refresh).not.toHaveBeenCalled();
    list.remove();
  });
});
