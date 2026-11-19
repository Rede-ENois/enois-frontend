import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { groupsApi } from "./groups";
import { mentorsApi } from "./mentors";

vi.mock("../api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api-client")>();
  return { ...actual, api: { get: vi.fn() } };
});

describe("cancelamento das buscas de catálogo", () => {
  afterEach(() => vi.mocked(api.get).mockReset());

  it("encaminha o sinal e os parâmetros da lista de grupos", async () => {
    const controller = new AbortController();

    await groupsApi.list("React", "g1", 10, controller.signal);

    expect(api.get).toHaveBeenCalledWith("/groups?query=React&cursor=g1&limit=10", {
      signal: controller.signal,
    });
  });

  it("encaminha o sinal e os parâmetros da lista de mentores", async () => {
    const controller = new AbortController();

    await mentorsApi.list("Java", "m1", 12, "React", controller.signal);

    expect(api.get).toHaveBeenCalledWith("/mentors?expertise=Java&cursor=m1&limit=12&query=React", {
      signal: controller.signal,
    });
  });
});
