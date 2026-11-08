// @vitest-environment jsdom
import { type RefObject, createRef } from "react";
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useFocusTrap } from "./use-focus-trap";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** O painel: dois botões dentro, um `aria-hidden` que não conta e o interruptor do trap. */
function Panel({ active }: { active: boolean }) {
  const ref = createRef<HTMLDivElement>();
  panels.ref = ref;
  useFocusTrap(ref, active);
  return (
    <div ref={ref} tabIndex={-1} data-testid="panel">
      <button type="button" data-testid="first">
        Atender
      </button>

      <button type="button" data-testid="last">
        Recusar
      </button>

      <button type="button" aria-hidden="true" data-testid="hidden">
        escondido
      </button>
    </div>
  );
}

const panels: { ref: RefObject<HTMLDivElement | null> } = { ref: createRef() };

function pressTab(options: { shiftKey?: boolean } = {}) {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey: options.shiftKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

describe("useFocusTrap", () => {
  let root: Root;
  let host: HTMLDivElement;
  let outside: HTMLButtonElement;

  const render = (active: boolean) => {
    root = createRoot(host);
    act(() => root.render(<Panel active={active} />));
  };

  const rerender = (active: boolean) => {
    act(() => root.render(<Panel active={active} />));
  };

  beforeEach(() => {
    host = document.createElement("div");
    outside = document.createElement("button");
    outside.textContent = "página de trás";
    document.body.append(host, outside);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
  });

  it("põe o foco dentro do painel ao abrir e dá a volta no Tab", () => {
    outside.focus();
    render(true);
    expect(document.activeElement).toBe(document.querySelector('[data-testid="first"]'));

    (document.querySelector('[data-testid="last"]') as HTMLButtonElement).focus();
    pressTab();
    expect(document.activeElement).toBe(document.querySelector('[data-testid="first"]'));

    pressTab({ shiftKey: true });
    expect(document.activeElement).toBe(document.querySelector('[data-testid="last"]'));
  });

  it("ignora o controle escondido na volta do Tab", () => {
    render(true);
    act(() => {
      (document.querySelector('[data-testid="last"]') as HTMLButtonElement).focus();
    });
    pressTab({ shiftKey: true });
    expect(document.activeElement).not.toBe(document.querySelector('[data-testid="hidden"]'));
  });

  it("devolve o foco a quem estava fora quando o painel sai da tela", () => {
    outside.focus();
    render(true);
    expect(document.activeElement).not.toBe(outside);

    act(() => root.unmount());
    expect(document.activeElement).toBe(outside);
  });

  it("não devolve o foco quando só o interruptor desliga (diálogo de denúncia)", () => {
    outside.focus();
    render(true);
    // O diálogo de denúncia tem o próprio trap: o painel continua na tela e o foco não pode
    // escapar para a página de trás no meio da chamada.
    (document.querySelector('[data-testid="last"]') as HTMLButtonElement).focus();
    rerender(false);
    expect(document.activeElement).toBe(document.querySelector('[data-testid="last"]'));

    rerender(true);
    expect(document.activeElement).toBe(document.querySelector('[data-testid="last"]'));
  });
});
