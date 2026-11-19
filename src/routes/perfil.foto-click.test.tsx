// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O gesto "clicar na própria foto para trocá-la": o dono vê o avatar como botão e o clique abre o
 * mesmo input de upload/recorte do menu "Editar perfil"; o visitante vê a imagem, sem botão. A
 * troca em si é o fluxo de recorte e upload que já existia — aqui importa que o caminho abra.
 */

const mocks = vi.hoisted(() => ({
  meId: "u-dono" as string | null,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useLoaderData: () => ({
      user: {
        id: "u-dono",
        username: "ana",
        name: "Ana Souza",
        banido: false,
        skills: [],
        goals: [],
        externalLinks: [],
      },
    }),
  }),
  useNavigate: () => () => undefined,
  Link: (props: Record<string, unknown>) => <a>{props.children}</a>,
  notFound: () => undefined,
}));
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({
    user: mocks.meId ? { id: mocks.meId } : null,
    requireAuth: () => undefined,
  }),
  useIsAuthenticated: () => mocks.meId !== null,
}));
vi.mock("@/lib/use-professional-identity", () => ({
  useProfessionalIdentity: () => ({ applicant: null, professionalSetupHref: null }),
}));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({
    status: "idle",
    progress: 0,
    upload: vi.fn().mockResolvedValue({ mediaId: "m1", cdnUrl: "https://cdn.test/a.jpg" }),
    uploadAll: vi.fn(),
    cancel: vi.fn(),
  }),
}));
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  contributorSealsApi: {},
  feedApi: {
    listByUserId: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listReplies: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  },
  gamesApi: {},
  messagesApi: {},
  networkApi: {},
  profileApi: {
    me: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({}),
  },
  rankingApi: {},
  recommendationsApi: {},
  authApi: { me: vi.fn().mockResolvedValue(null) },
}));
vi.mock("@/lib/api/media", () => ({ resolveCdnUrl: (url: string | null) => url ?? "" }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
// Componentes fora do gesto em teste: stub de uma linha cada, para a rota montar enxuta.
const Stub = ({ children }: { children?: React.ReactNode }) => <>{children ?? null}</>;
vi.mock("@/components/appearance/appearance-dialog", () => ({ AppearanceDialog: Stub }));
vi.mock("@/components/appearance/profile-look-dialog", () => ({ ProfileLookDialog: Stub }));
vi.mock("@/components/banner-html-frame", () => ({ BannerHtmlFrame: Stub }));
vi.mock("@/components/block-user-dialog", () => ({ BlockUserDialog: Stub }));
vi.mock("@/components/edit-profile-dialog", () => ({ EditProfileDialog: Stub }));
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: Stub }));
vi.mock("@/components/mute-user-dialog", () => ({ MuteUserDialog: Stub }));
vi.mock("@/components/post-card", () => ({ PostCard: Stub }));
vi.mock("@/components/post/report-dialog", () => ({ ReportDialog: Stub }));
vi.mock("@/components/post/rich-text", () => ({ RichText: Stub }));
vi.mock("@/components/post/sandboxed-html-frame", () => ({ SandboxedHtmlFrame: Stub }));
vi.mock("@/components/presence-indicator", () => ({ PresenceIndicator: Stub }));
vi.mock("@/components/profile-banner-dialog", () => ({ ProfileBannerDialog: Stub }));
vi.mock("@/components/profile-bio-dialog", () => ({ ProfileBioDialog: Stub }));
vi.mock("@/components/profile-resume-dialog", () => ({ ProfileResumeDialog: Stub }));
vi.mock("@/components/profile-seals", () => ({ ProfileSeals: Stub }));
vi.mock("@/components/profile/experiences-section", () => ({ ProfileExperiencesSection: Stub }));
vi.mock("@/components/profile/profile-city-dialog", () => ({ ProfileCityDialog: Stub }));
vi.mock("@/components/profile/profile-community-shelf", () => ({
  ProfileCommunityShelf: Stub,
}));
vi.mock("@/components/profile/profile-explore-panel", () => ({ ProfileExplorePanel: Stub }));
vi.mock("@/components/profile/profile-gamification-panel", () => ({
  ProfileGamificationPanel: Stub,
}));
vi.mock("@/components/profile/profile-network-dialog", () => ({ ProfileNetworkDialog: Stub }));
vi.mock("@/components/profile/profile-peek", () => ({ ProfilePeek: Stub }));
vi.mock("@/components/profile/profile-quick-composer", () => ({ ProfileQuickComposer: Stub }));
vi.mock("@/components/profile/profile-status-dialog", () => ({ ProfileStatusDialog: Stub }));
vi.mock("@/components/profile/projects-section", () => ({ ProfileProjectsSection: Stub }));
vi.mock("@/components/verified-contributor-prompt", () => ({ VerifiedContributorPrompt: Stub }));

const { Route } = await import("./perfil.$username");
const Profile = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

describe("o botão de trocar a foto no perfil", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Profile />
        </QueryClientProvider>,
      );
    });
    await settle();
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("no próprio perfil, a foto vira botão que abre o seletor de arquivo", async () => {
    mocks.meId = "u-dono";
    await render();

    const botao = [...host.querySelectorAll('button[aria-label="Trocar minha foto de perfil"]')];
    expect(botao).toHaveLength(1);

    // Dois inputs existem (banner e avatar, nesta ordem); o ref do botão aponta para o do avatar.
    const input = [...host.querySelectorAll('input[type="file"][accept="image/*"]')].at(-1);
    expect(input).not.toBeNull();

    // O clique do botão dispara o mesmo input que o menu usa: o fluxo de recorte/upload é um só.
    const abrir = vi.spyOn(input!, "click").mockImplementation(() => undefined);
    await act(async () => (botao[0] as HTMLButtonElement).click());
    await settle();
    expect(abrir).toHaveBeenCalled();
  });

  it("no perfil de outra pessoa, a foto não é botão", async () => {
    mocks.meId = "u-outro";
    await render();

    expect(host.querySelectorAll('button[aria-label="Trocar minha foto de perfil"]')).toHaveLength(
      0,
    );
  });
});
