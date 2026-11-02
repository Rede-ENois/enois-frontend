// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import { Lightbulb, Newspaper } from "lucide-react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostTypePicker } from "./post-type-picker";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OPTIONS = [
  { id: "INSIGHT", label: texts.feed.composer.types.insight, icon: Lightbulb },
  { id: "NEWS", label: texts.feed.composer.types.news, icon: Newspaper },
];

describe("seletor de tipo do compositor", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    document.body.innerHTML = "";
  });

  const render = (props?: Partial<Parameters<typeof PostTypePicker>[0]>) =>
    act(() =>
      root.render(
        <PostTypePicker options={OPTIONS} value="INSIGHT" onChange={vi.fn()} {...props} />,
      ),
    );

  const trigger = () =>
    [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) =>
      button.textContent?.includes(texts.feed.composer.typePicker.label),
    );

  const option = (id: string) => {
    const label = OPTIONS.find((item) => item.id === id)?.label;

    return [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(
      (button) => button.textContent === label,
    );
  };

  it("mostra o tipo atual no gatilho", () => {
    render();

    expect(trigger()?.textContent).toContain(
      `${texts.feed.composer.typePicker.label}: ${texts.feed.composer.types.insight}`,
    );
  });

  it("abre o painel com as opções do catálogo", () => {
    render();

    act(() => trigger()?.click());

    const painel = document.querySelector('[role="dialog"]');
    expect(painel).not.toBeNull();
    expect(painel?.textContent).toContain(texts.feed.composer.types.insight);
    expect(painel?.textContent).toContain(texts.feed.composer.types.news);
  });

  it("devolve o tipo escolhido e fecha o painel", () => {
    const onChange = vi.fn();
    render({ onChange });

    act(() => trigger()?.click());
    act(() => option("NEWS")?.click());

    expect(onChange).toHaveBeenCalledWith("NEWS");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("marca o tipo atual como pressionado ao abrir", () => {
    render();

    act(() => trigger()?.click());

    expect(option("INSIGHT")?.getAttribute("aria-pressed")).toBe("true");
    expect(option("NEWS")?.getAttribute("aria-pressed")).toBe("false");
  });

  it("fecha com Escape", () => {
    render();

    act(() => trigger()?.click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("fecha ao clicar fora", async () => {
    render();

    act(() => trigger()?.click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    // O Radix só registra o listener de pointerdown no próximo tick.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
      document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renderiza o painel fora do contêiner do compositor", () => {
    act(() =>
      root.render(
        <form data-testid="composer">
          <PostTypePicker options={OPTIONS} value="INSIGHT" onChange={vi.fn()} />
        </form>,
      ),
    );

    act(() => trigger()?.click());

    const painel = document.querySelector('[role="dialog"]');
    expect(painel).not.toBeNull();
    expect(painel?.closest("form")).toBeNull();
    expect(document.body.contains(painel)).toBe(true);
  });
});
