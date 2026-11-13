// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBanner } from "@/components/error-banner";

vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    status?: number;
    code?: string;
    path?: string;
  },
}));

let host: HTMLDivElement;
let root: Root;

const render = (error: unknown, showDetails = true) => {
  act(() => root.render(<ErrorBanner error={error} showDetails={showDetails} />));
  return host;
};

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("banner de erro", () => {
  /**
   * A mensagem da tela nasce como string — o estado de erro de quase todo formulário é
   * `useState<string | null>`. Sem este caso, o banner trocava o texto do servidor por
   * "Erro inesperado" e a pessoa lê um erro que não é o que aconteceu.
   */
  it("mostra a mensagem quando o erro é uma string", () => {
    render("Não foi possível publicar o horário.");

    expect(host.textContent).toContain("Não foi possível publicar o horário.");
    expect(host.textContent).not.toContain(texts.errors.unexpected);
  });

  it("usa o texto genérico só quando o valor não é um erro nem uma mensagem", () => {
    render({ qualquer: "coisa" });

    expect(host.textContent).toContain(texts.errors.unexpected);
  });

  it("um Error de verdade mantém a própria mensagem", () => {
    render(new Error("falhou de propósito"));

    expect(host.textContent).toContain("falhou de propósito");
  });
});
