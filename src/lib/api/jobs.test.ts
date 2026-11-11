import { describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { jobsApi } from "./jobs";

vi.mock("../api-client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
  buildQuery: (params: Record<string, unknown>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
  },
}));

describe("jobsApi.list", () => {
  it("manda o cursor da aba de externas", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], nextCursor: null });
    await jobsApi.list({ source: "EXTERNAL", cursor: "abc", limit: 10 });
    expect(api.get).toHaveBeenCalledWith("/jobs?source=EXTERNAL&cursor=abc&limit=10");
  });

  it("manda os filtros estruturados que o backend aceita", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], nextCursor: null });
    await jobsApi.list({
      source: "EXTERNAL",
      workModel: "REMOTE",
      employmentType: "CLT",
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
      salaryMin: 8000,
      remoteOnly: true,
      publishedAfter: "2026-11-01T00:00:00Z",
      sort: "recent",
      limit: 10,
    });
    const path = vi.mocked(api.get).mock.calls[0][0];
    expect(path).toContain("workModel=REMOTE");
    expect(path).toContain("employmentType=CLT");
    expect(path).toContain("city=S%C3%A3o+Paulo");
    expect(path).toContain("state=SP");
    expect(path).toContain("country=Brasil");
    expect(path).toContain("salaryMin=8000");
    expect(path).toContain("remoteOnly=true");
    expect(path).toContain("publishedAfter=2026-11-01T00%3A00%3A00Z");
    expect(path).toContain("sort=recent");
  });
});

describe("jobsApi.externalApplicationDraft", () => {
  it("busca a prévia no endpoint da vaga", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({});
    await jobsApi.externalApplicationDraft("ext_1");
    expect(api.get).toHaveBeenCalledWith("/jobs/external/ext_1/application");
  });
});

describe("jobsApi.applyExternal", () => {
  it("envia a confirmação explícita e a mensagem aparada", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});
    await jobsApi.applyExternal("ext_1", true, "  Tenho interesse.  ");
    expect(api.post).toHaveBeenCalledWith("/jobs/external/ext_1/application", {
      confirmed: true,
      message: "Tenho interesse.",
    });
  });

  it("sem mensagem, não manda o campo", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});
    await jobsApi.applyExternal("ext_1", true);
    expect(api.post).toHaveBeenCalledWith("/jobs/external/ext_1/application", {
      confirmed: true,
      message: undefined,
    });
  });
});
