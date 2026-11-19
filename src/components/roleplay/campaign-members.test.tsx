// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Route } from "@/routes/roleplay.$slug";
import type { Campaign } from "@/types/application/roleplay/campaign";
import type { CampaignMember } from "@/types/application/roleplay/campaign-member";
import type { GameTable } from "@/types/application/roleplay/table";
import type { TableState } from "@/types/application/roleplay/table-state";
import type { RoleplayCampaignPageProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => ReactNode }) => ({
    options,
    useParams: () => ({ slug: "campanha-teste-997" }),
  }),
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@rede-enois/design-system/ui")>()),
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));

// A página do design system não entra: aqui interessa só o que o contêiner monta para ela.
let pageProps: RoleplayCampaignPageProps | null = null;
vi.mock("@rede-enois/design-system/domain", () => ({
  RoleplayCampaignPage: (props: RoleplayCampaignPageProps) => {
    pageProps = props;
    return null;
  },
}));

vi.mock("@/lib/api", () => ({ callsApi: { join: vi.fn() }, roleplayApi: {} }));

const SLUG = "campanha-teste-997";
const CAMPAIGN_ID = "roleplay_campaign_1";
const TABLE_ID = "table-1";

// O backend pagina `/members` (PageResponse), como grupos e mesas já fazem.
const membersPage = {
  items: [
    {
      userId: "user-1",
      username: "ana",
      name: "Ana",
      avatar: null,
      role: "GAME_MASTER" as const,
      joinedAt: "2026-11-18T00:00:00Z",
    },
  ] satisfies CampaignMember[],
  nextCursor: null,
};

const table: GameTable = {
  id: TABLE_ID,
  campaignId: CAMPAIGN_ID,
  name: "Mesa da taverna",
  ownerId: "user-1",
  hasVoice: false,
  open: true,
  createdAt: "2026-11-18T00:00:00Z",
  updatedAt: "2026-11-18T00:00:00Z",
};

const tableState: TableState = {
  tableId: TABLE_ID,
  turnOrder: ["user-1"],
  activeTurnUserId: "user-1",
  turnStartedAt: null,
  scene: null,
  updatedAt: "2026-11-18T00:00:00Z",
};

const campaign: Campaign = {
  id: CAMPAIGN_ID,
  slug: SLUG,
  name: "Campanha Teste 997",
  description: null,
  setting: null,
  gameSystem: "d20-generico",
  systemFamily: "D20",
  visibility: "PUBLIC",
  status: "ACTIVE",
  members: 1,
  viewerRole: "GAME_MASTER",
  joined: true,
  createdAt: "2026-11-18T00:00:00Z",
};

describe("Campanha de RPG: membros paginados", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    pageProps = null;
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    // Semeia o cache com o formato real do servidor: `/members` é uma página.
    client.setQueryData(["roleplay", "campaign", SLUG], campaign);
    client.setQueryData(["roleplay", "tables", CAMPAIGN_ID], { items: [table], nextCursor: null });
    client.setQueryData(["roleplay", "members", CAMPAIGN_ID], membersPage);
    client.setQueryData(["roleplay", "tableState", TABLE_ID], tableState);
    const Page = Route.options.component!;
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Page />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("desembrulha a página de membros e mostra o nome na ordem de turno", () => {
    const tables = pageProps?.panels?.tables;
    expect(tables).toBeTruthy();
    expect(tables!.tables).toHaveLength(1);
    // Antes do conserto `members` era o PageResponse inteiro: o `.map` estourava e a tela morria.
    expect(tables!.tables[0].turnOrder).toEqual(["Ana"]);
    expect(tables!.tables[0].activeTurn).toBe("Ana");
  });

  it("monta a página da campanha com membros paginados", () => {
    expect(pageProps).not.toBeNull();
    expect(pageProps!.header.campaign.name).toBe("Campanha Teste 997");
  });
});
