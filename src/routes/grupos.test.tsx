// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GroupView } from "@/types/application/group/group-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  mine: vi.fn(),
  join: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    component: options.component,
  }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  Outlet: () => null,
  useMatchRoute: () => () => false,
  useNavigate: () => vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  groupsApi: {
    list: mocks.list,
    mine: mocks.mine,
    join: mocks.join,
  },
}));

vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./grupos");
const Grupos = (Route as any).component || (Route as any).options.component;

const myGroup: GroupView = {
  id: "group-mine-1",
  slug: "turma-do-cafe",
  name: "Turma do Café",
  description: "Grupo de café diário",
  topic: null,
  avatar: null,
  banner: null,
  bannerHtml: null,
  joinMode: "OPEN",
  status: "ACTIVE",
  members: 10,
  viewerRole: "OWNER",
  joined: true,
  requestPending: false,
  createdAt: "2026-10-01T12:00:00Z",
};

const suggestedGroup: GroupView = {
  id: "group-other-2",
  slug: "designers-brasil",
  name: "Designers Brasil",
  description: "Comunidade de UI/UX",
  topic: null,
  avatar: null,
  banner: null,
  bannerHtml: null,
  joinMode: "APPROVAL",
  status: "ACTIVE",
  members: 42,
  viewerRole: null,
  joined: false,
  requestPending: false,
  createdAt: "2026-10-15T12:00:00Z",
};

describe("painel de grupos: meus grupos e descobrir", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  beforeEach(() => {
    vi.clearAllMocks();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("mostra os grupos que participamos primeiro e novos grupos no painel Descobrir", async () => {
    mocks.mine.mockResolvedValueOnce({ items: [myGroup], nextCursor: null });
    mocks.list.mockResolvedValueOnce({ items: [myGroup, suggestedGroup], nextCursor: null });

    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Grupos />
        </QueryClientProvider>,
      );
    });
    await settle();

    // Título "Seus grupos" com a contagem (1)
    expect(host.textContent).toContain(texts.groups.myGroups);
    expect(host.textContent).toContain("Turma do Café");
    expect(host.textContent).toContain(texts.groups.roleOwner);

    // Painel lateral Descobrir contém a sugestão e NÃO repete o grupo que já participamos
    expect(host.textContent).toContain(texts.groups.discover);
    expect(host.textContent).toContain("Designers Brasil");

    // Botão de ação para pedir entrada no grupo sugerido
    const requestBtn = [...host.querySelectorAll("button")].find((btn) =>
      btn.textContent?.includes(texts.groups.requestJoin),
    );
    expect(requestBtn).toBeDefined();
  });

  it("mostra estado vazio amigável quando não participa de nenhum grupo", async () => {
    mocks.mine.mockResolvedValueOnce({ items: [], nextCursor: null });
    mocks.list.mockResolvedValueOnce({ items: [suggestedGroup], nextCursor: null });

    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Grupos />
        </QueryClientProvider>,
      );
    });
    await settle();

    expect(host.textContent).toContain(texts.groups.myGroupsEmpty);
    expect(host.textContent).toContain(texts.groups.myGroupsEmptyHint);
    expect(host.textContent).toContain("Designers Brasil");
  });
});