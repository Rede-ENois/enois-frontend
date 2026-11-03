import { describe, expect, it } from "vitest";

import { mediaPreviewUrl } from "./media-preview-url";

describe("mediaPreviewUrl", () => {
  // O compositor só gera `blob:` do arquivo escolhido; qualquer outra coisa que apareça no campo
  // não pode virar `src`.
  it("aceita a prévia blob do arquivo escolhido", () => {
    expect(mediaPreviewUrl("blob:https://enois.ia.br/1234-abcd")).toBe(
      "blob:https://enois.ia.br/1234-abcd",
    );
  });

  it("recusa outros esquemas que não sejam a prévia local", () => {
    expect(mediaPreviewUrl("javascript:alert(1)")).toBeUndefined();
    expect(mediaPreviewUrl("data:text/html,<img src=x onerror=alert(1)>")).toBeUndefined();
    expect(mediaPreviewUrl("https://exemplo.test/foto.png")).toBeUndefined();
    expect(mediaPreviewUrl("<img src=x onerror=alert(1)>")).toBeUndefined();
  });

  it("trata vazio e ausente como sem prévia", () => {
    expect(mediaPreviewUrl("")).toBeUndefined();
    expect(mediaPreviewUrl(null)).toBeUndefined();
    expect(mediaPreviewUrl(undefined)).toBeUndefined();
  });
});
