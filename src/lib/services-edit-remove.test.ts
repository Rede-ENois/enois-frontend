import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { servicesApi } from "./api";

/**
 * Editar e remover a própria oferta (#358): os dois falam com a mesma oferta e o corpo da
 * edição é o mesmo da publicação — o back reaproveita a validação da criação.
 */
describe("serviços: editar e remover a própria oferta", () => {
  const fetchMock = vi.fn();
  const location = { origin: "https://enois.ia.br", href: "/meus-servicos" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", { location });
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    vi.stubGlobal("fetch", fetchMock);
    location.href = "/meus-servicos";
  });

  afterEach(() => vi.unstubAllGlobals());

  const input = {
    category: "Desenvolvimento",
    title: "Site institucional",
    description: "Site de cinco páginas com painel simples.",
    deliverables: "Código, painel e um mês de suporte.",
    price: 1200,
    currency: "FAISCA" as const,
    deliveryDays: 7,
  };

  it("a edição vai por PUT na oferta, com o mesmo corpo da publicação", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: "of1", status: "ACTIVE" }));

    await expect(servicesApi.editListing("of1", input)).resolves.toEqual({
      id: "of1",
      status: "ACTIVE",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/servicos/ofertas/of1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual(input);
  });

  it("remover vai por DELETE na oferta, sem corpo", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: "of1", status: "REMOVED" }));

    await expect(servicesApi.removeListing("of1")).resolves.toEqual({
      id: "of1",
      status: "REMOVED",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/servicos/ofertas/of1");
    expect(init.method).toBe("DELETE");
  });

  it("o id da oferta vai no caminho, não no corpo", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ id: "of2", status: "ACTIVE" }));

    await servicesApi.editListing("of2", input);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/of2");
    expect(JSON.parse(init.body)).not.toHaveProperty("id");
  });
});
