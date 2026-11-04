// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-client";
import { isProhibitedContent } from "@/lib/media-moderation";

import { ConductLessonDialog } from "./conduct-lesson-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** O aviso só é educativo se a pessoa consegue ler a regra e sair dele. */
describe("Lição de bons modos", () => {
  it("mostra as quatro regras e fecha pelo botão de entendido", () => {
    const vistos: boolean[] = [];

    act(() => {
      root.render(<ConductLessonDialog open onOpenChange={(next) => vistos.push(next)} />);
    });

    const texto = document.body.textContent ?? "";
    expect(texto).toContain(texts.conductLesson.title);
    expect(texto).toContain(texts.conductLesson.badge);

    for (const regra of Object.values(texts.conductLesson.rules)) {
      expect(texto).toContain(regra.title);
      expect(texto).toContain(regra.body);
    }

    const botao = [...document.body.querySelectorAll("button")].find((elemento) =>
      elemento.textContent?.includes(texts.conductLesson.dismiss),
    );
    expect(botao).toBeDefined();

    act(() => botao?.click());

    expect(vistos).toContain(false);
  });

  it("não renderiza o conteúdo quando fechado", () => {
    act(() => {
      root.render(<ConductLessonDialog open={false} onOpenChange={() => {}} />);
    });

    expect(document.body.textContent ?? "").not.toContain(texts.conductLesson.title);
  });
});

/**
 * O gatilho é o código da API, não a mensagem: abrir a lição por engano (falha de rede, arquivo
 * grande demais) culpabilizaria quem não fez nada errado, e deixar de abrir no conteúdo proibido
 * perde a explicação da regra.
 */
describe("Gatilho da lição", () => {
  it("reconhece o código de conteúdo proibido", () => {
    expect(isProhibitedContent(new ApiError(422, "IMAGE_CONTENT_NOT_ALLOWED", "barrado"))).toBe(
      true,
    );
  });

  it("não dispara em outro erro da API", () => {
    expect(isProhibitedContent(new ApiError(422, "IMAGE_CANNOT_BE_VERIFIED", "falhou"))).toBe(
      false,
    );
    expect(isProhibitedContent(new ApiError(413, "MEDIA_TYPE_NOT_ALLOWED", "grande"))).toBe(false);
  });

  it("não dispara em erro comum do navegador", () => {
    expect(isProhibitedContent(new Error("network"))).toBe(false);
    expect(isProhibitedContent(undefined)).toBe(false);
  });
});
