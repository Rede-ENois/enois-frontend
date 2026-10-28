import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { cosmeticEventsApi } from "./cosmetic-events";

vi.mock("../api-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const duel = {
  active: true,
  startsAt: "2026-10-31T03:00:00Z",
  endsAt: "2026-11-01T02:59:59Z",
  counts: { saci: 3, halloween: 2 },
  myChoice: null,
  winner: null,
};

const hunt = {
  active: true,
  startsAt: "2026-10-31T03:00:00Z",
  endsAt: "2026-11-01T02:59:59Z",
  spots: 7,
  found: ["feed"],
  completed: false,
};

describe("Contrato dos eventos da loja", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lê o duelo com instantes ISO", async () => {
    vi.mocked(api.get).mockResolvedValue(duel);
    expect(await cosmeticEventsApi.duel()).toEqual(duel);
    expect(api.get).toHaveBeenCalledWith("/eventos/saci-halloween");
  });

  it("recusa time desconhecido no duelo", async () => {
    vi.mocked(api.get).mockResolvedValue({ ...duel, myChoice: "curupira" });
    await expect(cosmeticEventsApi.duel()).rejects.toThrow();
  });

  it("recusa data que não é instante ISO", async () => {
    vi.mocked(api.get).mockResolvedValue({ ...duel, startsAt: "31/10/2026" });
    await expect(cosmeticEventsApi.duel()).rejects.toThrow();
  });

  it("envia a escolha do time", async () => {
    vi.mocked(api.post).mockResolvedValue({ ...duel, myChoice: "saci" });
    expect((await cosmeticEventsApi.choose("saci")).myChoice).toBe("saci");
    expect(api.post).toHaveBeenCalledWith("/eventos/saci-halloween/escolha", { choice: "saci" });
  });

  it("lê a caça e reporta um esconderijo", async () => {
    vi.mocked(api.get).mockResolvedValue(hunt);
    expect(await cosmeticEventsApi.hunt()).toEqual(hunt);
    vi.mocked(api.post).mockResolvedValue({ ...hunt, found: ["feed", "vagas"] });
    expect((await cosmeticEventsApi.find("vagas")).found).toEqual(["feed", "vagas"]);
    expect(api.post).toHaveBeenCalledWith("/eventos/caca-saci/achados/vagas", {});
  });

  it("recusa esconderijo desconhecido na resposta", async () => {
    vi.mocked(api.get).mockResolvedValue({ ...hunt, found: ["cozinha"] });
    await expect(cosmeticEventsApi.hunt()).rejects.toThrow();
  });
});
