import { describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { portfolioApi } from "./portfolio";

vi.mock("../api-client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe("portfolioApi", () => {
  it("lê a vitrine pública pelo username, escapado no caminho", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ username: "ana", version: 1, blocks: [] });
    await portfolioApi.byUsername("ana souza");
    expect(api.get).toHaveBeenCalledWith("/portfolio/ana%20souza");
  });

  it("lê o rascunho do dono", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ html: null, publishedVersion: 0, blocks: [] });
    await portfolioApi.mine();
    expect(api.get).toHaveBeenCalledWith("/me/portfolio");
  });

  it("grava o rascunho num PUT idempotente", async () => {
    vi.mocked(api.put).mockResolvedValueOnce({});
    await portfolioApi.saveDraft("<p>Olá</p>");
    expect(api.put).toHaveBeenCalledWith("/me/portfolio/draft", { html: "<p>Olá</p>" });
  });

  it("cria peça no POST e atualiza no PUT com o id escapado", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});
    vi.mocked(api.put).mockResolvedValueOnce({});
    await portfolioApi.createBlock({ type: "LINK", linkUrl: "https://exemplo.test" });
    expect(api.post).toHaveBeenCalledWith("/me/portfolio/blocks", {
      type: "LINK",
      linkUrl: "https://exemplo.test",
    });
    await portfolioApi.updateBlock("block/1", { type: "TEXT", text: "oi" });
    expect(api.put).toHaveBeenCalledWith("/me/portfolio/blocks/block%2F1", {
      type: "TEXT",
      text: "oi",
    });
  });

  it("remove a peça e reordena com a lista completa", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({});
    vi.mocked(api.put).mockResolvedValueOnce({});
    await portfolioApi.removeBlock("block_1");
    expect(api.delete).toHaveBeenCalledWith("/me/portfolio/blocks/block_1");
    await portfolioApi.reorder(["b2", "b1"]);
    expect(api.put).toHaveBeenCalledWith("/me/portfolio/order", { order: ["b2", "b1"] });
  });

  it("publica sem corpo", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ version: 2 });
    await portfolioApi.publish();
    expect(api.post).toHaveBeenCalledWith("/me/portfolio/publish");
  });
});
