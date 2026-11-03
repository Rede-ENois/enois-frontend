import { describe, expect, it, vi } from "vitest";

import { profileApi } from "./profile";

const put = vi.hoisted(() => vi.fn());
vi.mock("../api-client", () => ({
  // O erro de verdade do cliente, não um mock parcial: o código é o que a tela lê.
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
      readonly path: string,
    ) {
      super(message);
    }
  },
  api: { put, get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const emptyAppearance = {
  social: {
    theme: "web2000",
    accent: null,
    font: null,
    header: null,
    textures: null,
    borders: null,
    decoration: null,
  },
  professional: {
    theme: null,
    accent: null,
    font: null,
    header: null,
    textures: null,
    borders: null,
    decoration: null,
  },
};

describe("appearance of the profile", () => {
  it("sends both sides to the profile endpoint", async () => {
    put.mockResolvedValueOnce(emptyAppearance);

    await expect(profileApi.setProfileAppearance(emptyAppearance)).resolves.toEqual(
      emptyAppearance,
    );
    expect(put).toHaveBeenCalledWith("/me/profile-appearance", emptyAppearance);
  });

  it("fails loudly when the route answers with an empty body", async () => {
    // Rota ausente responde 200 vazio (anti-enumeração), não 404. Tratar isso como sucesso
    // fechava o diálogo dizendo "salvo" sem ter gravado nada.
    put.mockResolvedValueOnce(undefined);

    await expect(profileApi.setProfileAppearance(emptyAppearance)).rejects.toMatchObject({
      code: "PROFILE_APPEARANCE_UNAVAILABLE",
    });
  });
});
