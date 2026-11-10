import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-client";

import { publicProfileErrorCopy } from "./public-profile-error";

describe("publicProfileErrorCopy", () => {
  it("trata 404 como perfil inexistente/desativado", () => {
    const copy = publicProfileErrorCopy(new ApiError(404, "NOT_FOUND", "x", "/corporate/melissa"));

    expect(copy.title).toBe(texts.corporate.publicProfile.notFoundTitle);
    expect(copy.description).toBe(texts.corporate.publicProfile.notFoundBody);
  });

  it("não fala em salvar quando o perfil só não carregou", () => {
    const copy = publicProfileErrorCopy(
      new ApiError(503, "UNAVAILABLE", "x", "/corporate/melissa"),
    );

    expect(copy.title).toBe(texts.corporate.publicProfile.loadErrorTitle);
    expect(copy.description).toBe(texts.corporate.publicProfile.loadErrorBody);
    expect(copy.title).not.toBe(texts.corporate.publicProfile.notFoundTitle);
    expect(copy.description).not.toBe(texts.corporate.saveError);
  });

  it("erro que não é da API também é falha de carga, não de salvamento", () => {
    const copy = publicProfileErrorCopy(new Error("network down"));

    expect(copy.description).toBe(texts.corporate.publicProfile.loadErrorBody);
  });
});
