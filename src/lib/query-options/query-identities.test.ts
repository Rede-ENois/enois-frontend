import { QueryClient, QueryObserver } from "@tanstack/react-query";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  communitiesApi,
  communityProjectsApi,
  companiesApi,
  networkApi,
  profileApi,
  projectsApi,
  walletApi,
} from "@/lib/api";

import { communityQueries } from "./communities";
import { companyQueries } from "./companies";
import { networkQueries } from "./network";
import { profileQueries } from "./profiles";
import { projectQueries } from "./projects";
import { walletQueries } from "./wallet";

vi.mock("@/lib/api", () => ({
  communitiesApi: { mine: vi.fn() },
  communityProjectsApi: { mine: vi.fn() },
  companiesApi: { mine: vi.fn(), bySlug: vi.fn(), directory: vi.fn() },
  networkApi: { requests: vi.fn() },
  profileApi: { getById: vi.fn() },
  projectsApi: { mine: vi.fn() },
  walletApi: { wallet: vi.fn() },
}));

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

beforeEach(() => vi.clearAllMocks());

describe("identidade e invalidação das consultas", () => {
  it("mantém projetos pessoais e comunitários separados, inclusive em observador desabilitado", async () => {
    vi.mocked(projectsApi.mine).mockResolvedValue([{ id: "pessoal", stack: ["TS"] }] as never);
    vi.mocked(communityProjectsApi.mine).mockResolvedValue([
      { id: "comunitario", status: "PENDING" },
    ] as never);
    const client = createClient();
    const observer = new QueryObserver(client, { ...projectQueries.profileMine(), enabled: false });
    await client.fetchQuery(projectQueries.communityMine());
    expect(observer.getCurrentResult().data).toBeUndefined();
    await client.fetchQuery(projectQueries.profileMine());
    expect(client.getQueryData(projectQueries.profileMine().queryKey)?.[0].stack).toEqual(["TS"]);
    expect(client.getQueryData(projectQueries.communityMine().queryKey)?.[0].id).toBe(
      "comunitario",
    );
    await client.invalidateQueries({ queryKey: projectQueries.all, refetchType: "none" });
    expect(client.getQueryState(projectQueries.profileMine().queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(projectQueries.communityMine().queryKey)?.isInvalidated).toBe(true);
  });

  it("consulta comunidades com os limites corretos e invalida todas as variantes", async () => {
    vi.mocked(communitiesApi.mine).mockImplementation(
      async (limit) =>
        ({
          items: Array.from({ length: limit ?? 0 }, (_, i) => ({ id: String(i) })),
          nextCursor: null,
        }) as never,
    );
    const client = createClient();
    expect((await client.fetchQuery(communityQueries.mine(4))).items).toHaveLength(4);
    expect((await client.fetchQuery(communityQueries.mine(8))).items).toHaveLength(8);
    expect((await client.fetchQuery(communityQueries.mine(50))).items).toHaveLength(50);
    expect(communitiesApi.mine).toHaveBeenCalledTimes(3);
    await client.invalidateQueries({ queryKey: communityQueries.mineKey, refetchType: "none" });
    expect(client.getQueryState(communityQueries.mine(4).queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(communityQueries.mine(8).queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(communityQueries.mine(50).queryKey)?.isInvalidated).toBe(true);
  });

  it("mantém limites de convites separados e invalida ambos pelo domínio", async () => {
    vi.mocked(networkApi.requests).mockImplementation(
      async (_cursor, limit) =>
        ({
          items: Array.from({ length: limit ?? 0 }, (_, i) => ({ id: String(i) })),
          nextCursor: null,
        }) as never,
    );
    const client = createClient();
    expect((await client.fetchQuery(networkQueries.requests(50))).items).toHaveLength(50);
    expect((await client.fetchQuery(networkQueries.requests(20))).items).toHaveLength(20);
    await client.invalidateQueries({ queryKey: networkQueries.all, refetchType: "none" });
    expect(client.getQueryState(networkQueries.requests(20).queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(networkQueries.requests(50).queryKey)?.isInvalidated).toBe(true);
  });

  it("compartilha carteira e refaz a busca depois da invalidação", async () => {
    vi.mocked(walletApi.wallet)
      .mockResolvedValueOnce({ balance: 10 } as never)
      .mockResolvedValueOnce({ balance: 7 } as never);
    const client = createClient();
    expect((await client.fetchQuery(walletQueries.wallet())).balance).toBe(10);
    expect((await client.fetchQuery(walletQueries.wallet())).balance).toBe(10);
    expect(walletApi.wallet).toHaveBeenCalledTimes(1);
    await client.invalidateQueries({
      queryKey: walletQueries.wallet().queryKey,
      refetchType: "none",
    });
    expect((await client.fetchQuery(walletQueries.wallet())).balance).toBe(7);
  });

  it("invalida diretórios filtrados e empresas próprias após edição", async () => {
    vi.mocked(companiesApi.directory).mockResolvedValue([]);
    vi.mocked(companiesApi.mine).mockResolvedValue([]);
    const client = createClient();
    await client.fetchQuery(companyQueries.directory("primeiro", null));
    await client.fetchQuery(companyQueries.directory("segundo", "Tecnologia"));
    await client.fetchQuery(companyQueries.mine());
    await client.invalidateQueries({ queryKey: companyQueries.directoryKey, refetchType: "none" });
    await client.invalidateQueries({
      queryKey: companyQueries.mine().queryKey,
      refetchType: "none",
    });
    expect(
      client.getQueryState(companyQueries.directory("primeiro", null).queryKey)?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(companyQueries.directory("segundo", "Tecnologia").queryKey)
        ?.isInvalidated,
    ).toBe(true);
    expect(client.getQueryState(companyQueries.mine().queryKey)?.isInvalidated).toBe(true);
  });

  it("reutiliza uma consulta individual de perfil", async () => {
    vi.mocked(profileApi.getById).mockResolvedValue({ id: "p1" } as never);
    const client = createClient();
    await Promise.all([
      client.fetchQuery(profileQueries.byId("p1")),
      client.fetchQuery(profileQueries.byId("p1")),
    ]);
    expect(profileApi.getById).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(profileQueries.byId("p1").queryKey)?.id).toBe("p1");
  });
});
