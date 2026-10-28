import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { lojaApi } from "./loja";

vi.mock("../api-client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const oldest = {
  id: "moldura-ambar",
  kind: "FRAME",
  collection: null,
  name: "Âmbar",
  description: "",
  priceMf: 2000,
  cssRing: "",
  releaseOrder: 1,
  available: true,
  purchasable: true,
};
const newest = { ...oldest, id: "moldura-galaxia", name: "Galáxia", releaseOrder: 18 };
const seasonal = {
  ...oldest,
  id: "moldura-redemoinho",
  kind: "FRAME",
  collection: "saci",
  name: "Redemoinho",
  releaseOrder: 27,
  available: false,
  owned: true,
  equipped: false,
};

describe("Contrato de ordenação da loja", () => {
  beforeEach(() => vi.resetAllMocks());

  it("solicita as mais antigas por padrão e mantém a resposta da API", async () => {
    vi.mocked(api.get).mockResolvedValue([oldest, newest]);
    expect(await lojaApi.catalog()).toEqual([oldest, newest]);
    expect(api.get).toHaveBeenCalledWith("/loja?order=oldest");
  });

  it("solicita as mais novas e mantém a resposta da API", async () => {
    vi.mocked(api.get).mockResolvedValue([newest, oldest]);
    expect(await lojaApi.catalog("newest")).toEqual([newest, oldest]);
    expect(api.get).toHaveBeenCalledWith("/loja?order=newest");
  });

  it("recusa o contrato antigo sem sequência de lançamento", async () => {
    const { releaseOrder, ...legacy } = oldest;
    vi.mocked(api.get).mockResolvedValue([legacy]);
    await expect(lojaApi.catalog()).rejects.toThrow();
  });

  it.each(["oldest", "newest"] as const)(
    "recusa a resposta fora da ordem %s, sem reordenar localmente",
    async (order) => {
      vi.mocked(api.get).mockResolvedValue(
        order === "oldest" ? [newest, oldest] : [oldest, newest],
      );
      await expect(lojaApi.catalog(order)).rejects.toThrow(
        "O catálogo não respeitou a ordenação solicitada.",
      );
    },
  );

  it("recusa sequências de lançamento duplicadas", async () => {
    vi.mocked(api.get).mockResolvedValue([oldest, { ...newest, releaseOrder: 1 }]);
    await expect(lojaApi.catalog()).rejects.toThrow();
  });

  it("recusa itens duplicados mesmo com sequências diferentes", async () => {
    vi.mocked(api.get).mockResolvedValue([oldest, { ...newest, id: oldest.id }]);
    await expect(lojaApi.catalog()).rejects.toThrow();
  });

  it("propaga a falha da API", async () => {
    const failure = new Error("Catálogo indisponível");
    vi.mocked(api.get).mockRejectedValue(failure);
    await expect(lojaApi.catalog()).rejects.toBe(failure);
  });

  it("aceita os itens sazonais com coleção, temporada e posse", async () => {
    vi.mocked(api.get).mockResolvedValue([oldest, seasonal]);
    expect(await lojaApi.catalog()).toEqual([oldest, seasonal]);
  });

  it("recusa um tipo de item desconhecido", async () => {
    vi.mocked(api.get).mockResolvedValue([{ ...oldest, kind: "HAT" }]);
    await expect(lojaApi.catalog()).rejects.toThrow();
  });

  it("recusa o item sem disponibilidade", async () => {
    const { available, ...withoutSeason } = oldest;
    vi.mocked(api.get).mockResolvedValue([withoutSeason]);
    await expect(lojaApi.catalog()).rejects.toThrow();
  });
});

describe("Contrato das coleções, looks, equipar e status", () => {
  beforeEach(() => vi.resetAllMocks());

  const collection = {
    id: "saci",
    name: "Dia do Saci",
    available: true,
    windows: [{ start: "10-15", end: "11-02" }],
    looks: [
      {
        id: "look-saci",
        title: "Saci-pererê",
        items: ["tema-saci", "moldura-redemoinho"],
        statusIcon: "carapuca",
        statusText: "Procurando minha carapuça",
      },
    ],
  };

  it("lê as coleções com janelas e looks", async () => {
    vi.mocked(api.get).mockResolvedValue([collection]);
    expect(await lojaApi.collections()).toEqual([collection]);
    expect(api.get).toHaveBeenCalledWith("/loja/colecoes");
  });

  it("recusa janela fora do formato mês-dia", async () => {
    vi.mocked(api.get).mockResolvedValue([
      { ...collection, windows: [{ start: "2026-10-15", end: "11-02" }] },
    ]);
    await expect(lojaApi.collections()).rejects.toThrow();
  });

  it("compra o look e devolve as peças compradas", async () => {
    const purchase = { id: "look-saci", bought: ["tema-saci"], priceMf: 23000 };
    vi.mocked(api.post).mockResolvedValue(purchase);
    expect(await lojaApi.buyLook("look-saci")).toEqual(purchase);
    expect(api.post).toHaveBeenCalledWith("/loja/looks/look-saci/comprar", {});
  });

  it("desequipa pelo endpoint próprio", async () => {
    vi.mocked(api.post).mockResolvedValue({ id: "tema-saci", equipped: false });
    expect(await lojaApi.unequip("tema-saci")).toEqual({ id: "tema-saci", equipped: false });
    expect(api.post).toHaveBeenCalledWith("/loja/tema-saci/desequipar", {});
  });

  it("salva o status e lê só o status do perfil devolvido", async () => {
    vi.mocked(api.put).mockResolvedValue({
      username: "ana",
      statusText: "Oi",
      statusIcon: "cafe",
    });
    expect(await lojaApi.setStatus("Oi", "cafe")).toEqual({ statusText: "Oi", statusIcon: "cafe" });
    expect(api.put).toHaveBeenCalledWith("/me/status", { text: "Oi", icon: "cafe" });
  });
});
