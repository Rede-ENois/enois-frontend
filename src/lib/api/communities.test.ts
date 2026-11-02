import { afterEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();

vi.mock("../api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api-client")>();
  return { ...actual, api: { get: (path: string): unknown => get(path) } };
});

const { communitiesApi } = await import("./communities");

describe("communitiesApi location", () => {
  afterEach(() => get.mockReset());

  it("sends the city and state filter with the other list params", async () => {
    await communitiesApi.list({
      topic: "TECNOLOGIA",
      q: "go",
      city: "Belo Horizonte",
      state: "MG",
    });

    expect(get).toHaveBeenCalledWith(
      "/communities?topic=TECNOLOGIA&limit=20&q=go&city=Belo+Horizonte&state=MG",
    );
  });

  it("filters by state alone and leaves empty params out", async () => {
    await communitiesApi.list({ state: "SP", city: "" });

    expect(get).toHaveBeenCalledWith("/communities?limit=20&state=SP");
  });

  it("asks for the viewer's local communities", async () => {
    await communitiesApi.local();

    expect(get).toHaveBeenCalledWith("/communities/local?limit=20");
  });
});
