import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import { quadroAusente } from "./detalhe-de-quadro";

describe("quadroAusente", () => {
  it("só o 404 é 'não existe mais'", () => {
    expect(quadroAusente(new ApiError(404, "COLECAO_NOT_FOUND", "Coleção não encontrada."))).toBe(
      true,
    );
  });

  it("falha de sessão, servidor e rede não viram 'não encontrado'", () => {
    expect(quadroAusente(new ApiError(0, "SESSION_CHECK_UNAVAILABLE", "sem sessão"))).toBe(false);
    expect(quadroAusente(new ApiError(500, "INTERNAL", "erro"))).toBe(false);
    expect(quadroAusente(new TypeError("Failed to fetch"))).toBe(false);
    expect(quadroAusente(undefined)).toBe(false);
  });
});
