import { describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { noticesApi } from "./notices";

vi.mock("../api-client", () => ({ api: { get: vi.fn() } }));

describe("aviso ativo", () => {
  it("converte a resposta sem conteúdo em null para o cache", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(undefined);
    await expect(noticesApi.current()).resolves.toBeNull();
    expect(api.get).toHaveBeenCalledWith("/avisos/ativo");
  });

  it("mantém falhas de rede como erros", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("erro de rede"));
    await expect(noticesApi.current()).rejects.toThrow("erro de rede");
  });
});
