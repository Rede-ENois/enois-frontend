// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounced-value";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Monta o hook num container real e expõe o valor atual pelas renderizações. */
function mount(value: string, delayMs: number) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root;
  let latest = value;

  function Probe({ value }: { value: string }) {
    latest = useDebouncedValue(value, delayMs);
    return null;
  }

  act(() => {
    root = createRoot(container);
    root.render(<Probe value={value} />);
  });

  return {
    get latest() {
      return latest;
    },
    set(value: string) {
      act(() => root.render(<Probe value={value} />));
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("entrega o valor inicial imediatamente", () => {
    const probe = mount("ana", 300);
    expect(probe.latest).toBe("ana");
    probe.unmount();
  });

  it("só acompanha a entrada depois da pausa", () => {
    const probe = mount("", 300);

    probe.set("a");
    act(() => void vi.advanceTimersByTime(150));
    expect(probe.latest).toBe("");

    act(() => void vi.advanceTimersByTime(150));
    expect(probe.latest).toBe("a");
    probe.unmount();
  });

  it("digitação contínua não dispara valores intermediários", () => {
    const probe = mount("", 300);

    for (const value of ["m", "me", "mel", "meli"]) {
      probe.set(value);
      act(() => void vi.advanceTimersByTime(100));
    }
    expect(probe.latest).toBe("");

    act(() => void vi.advanceTimersByTime(300));
    expect(probe.latest).toBe("meli");
    probe.unmount();
  });

  it("desmontar cancela o timer pendente", () => {
    const probe = mount("", 300);
    probe.set("ana");
    probe.unmount();
    act(() => void vi.advanceTimersByTime(1000));
    expect(vi.getTimerCount()).toBe(0);
  });
});
