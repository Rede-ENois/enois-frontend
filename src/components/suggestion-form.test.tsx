// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SuggestionForm } from "./suggestion-form";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));

vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  suggestionsApi: { submit: mocks.submit },
}));

function setValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) {
  const prototype = Object.getPrototypeOf(element) as object;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(
    new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }),
  );
}

describe("SuggestionForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.submit.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SuggestionForm />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const send = () => {
    const button = container.querySelector<HTMLButtonElement>("button");
    if (!button) throw new Error("botão de envio ausente");
    button.click();
  };

  it("não pede nome nem e-mail: a sugestão é anônima na issue pública", () => {
    expect(container.querySelector('input[type="email"]')).toBeNull();
    // Só o título é um campo de linha única: nenhum campo de contato.
    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(container.querySelectorAll("textarea")).toHaveLength(1);
  });

  it("bloqueia o envio de título e texto curtos, sem chamar a API", async () => {
    await act(async () => send());

    expect(container.textContent).toContain(texts.suggestions.validationTitle);
    expect(container.textContent).toContain(texts.suggestions.validationBody);
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("envia só destino, título e texto", async () => {
    mocks.submit.mockResolvedValue({ id: "sugg_1" });

    act(() => {
      setValue(container.querySelector("#suggestion-target")!, "DESIGN_SYSTEM");
      setValue(container.querySelector("#suggestion-title")!, "  Modo escuro nas conversas ");
      setValue(
        container.querySelector("#suggestion-body")!,
        "Seria ótimo ter um modo escuro nas conversas.",
      );
    });
    await act(async () => send());

    expect(mocks.submit).toHaveBeenCalledWith({
      target: "DESIGN_SYSTEM",
      title: "Modo escuro nas conversas",
      body: "Seria ótimo ter um modo escuro nas conversas.",
    });
    expect(container.textContent).toContain(texts.suggestions.successTitle);
  });
});
