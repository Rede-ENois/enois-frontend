// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ToastProvider } from "@rede-enois/design-system/ui";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O clique na própria foto do perfil (#933): no perfil próprio, o card recebe o callback onAvatarClick
 * com um botão que abre o mesmo seletor de imagem do menu "Editar perfil"; em perfil alheio
 * não há botão e o avatar padrão do design system permanece.
 */

const mocks = vi.hoisted(() => ({
  clickAvatarInput: vi.fn(),
  getProfile: vi.fn(),
}));

const dadosDaRota = { user: null as unknown };
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useLoaderData: () => dadosDaRota,
    useNavigate: () => () => undefined,
  }),
  useNavigate: () => () => undefined,
  Link: (props: Record<string, unknown>) => <a {...props} />,
  notFound: () => undefined,
}));
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  contributorSealsApi: {},
  feedApi: {},
  gamesApi: {},
  messagesApi: {},
  networkApi: {},
  profileApi: { get: mocks.getProfile },
  rankingApi: {},
  recommendationsApi: {},
  authApi: {},
}));
vi.mock("@/lib/api/media", () => ({ resolveCdnUrl: (url: string | null) => url ?? "" }));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ status: "idle", cancel: vi.fn() }),
}));
vi.mock("@/lib/use-professional-identity", () => ({
  useProfessionalIdentity: () => ({ applicant: null, professionalSetupHref: null }),
}));

vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children?: ReactNode }) => children,
}));
vi.mock("@/components/edit-profile-dialog", () => ({ EditProfileDialog: () => null }));
vi.mock("@/components/profile-banner-dialog", () => ({ ProfileBannerDialog: () => null }));
vi.mock("@/components/profile-bio-dialog", () => ({ ProfileBioDialog: () => null }));
vi.mock("@/components/profile-resume-dialog", () => ({ ProfileResumeDialog: () => null }));
vi.mock("@/components/profile/profile-city-dialog", () => ({ ProfileCityDialog: () => null }));
vi.mock("@/components/profile/profile-status-dialog", () => ({ ProfileStatusDialog: () => null }));
vi.mock("@/components/appearance/appearance-dialog", () => ({ AppearanceDialog: () => null }));
vi.mock("@/components/appearance/profile-look-dialog", () => ({ ProfileLookDialog: () => null }));
vi.mock("@/components/block-user-dialog", () => ({ BlockUserDialog: () => null }));
vi.mock("@/components/mute-user-dialog", () => ({ MuteUserDialog: () => null }));
vi.mock("@/components/post/report-dialog", () => ({ ReportDialog: () => null }));
vi.mock("@/components/profile/profile-network-dialog", () => ({
  ProfileNetworkDialog: () => null,
}));
vi.mock("@/components/profile/profile-explore-panel", () => ({
  ProfileExplorePanel: () => null,
}));
vi.mock("@/components/profile/profile-gamification-panel", () => ({
  ProfileGamificationPanel: () => null,
}));
vi.mock("@/components/profile/profile-community-shelf", () => ({
  ProfileCommunityShelf: () => null,
}));
vi.mock("@/components/profile/profile-peek", () => ({
  ProfilePeek: ({ children }: { children?: ReactNode }) => children,
}));
vi.mock("@/components/profile/profile-quick-composer", () => ({
  ProfileQuickComposer: () => null,
}));
vi.mock("@/components/profile/projects-section", () => ({ ProfileProjectsSection: () => null }));
vi.mock("@/components/profile/experiences-section", () => ({
  ProfileExperiencesSection: () => null,
}));
vi.mock("@/components/verified-contributor-prompt", () => ({
  VerifiedContributorPrompt: () => null,
}));
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: () => null }));
vi.mock("@/components/presence-indicator", () => ({ PresenceIndicator: () => null }));
vi.mock("@/components/post-card", () => ({ PostCard: () => null }));
vi.mock("@/components/post/rich-text", () => ({ RichText: () => null }));
vi.mock("@/components/post/sandboxed-html-frame", () => ({ SandboxedHtmlFrame: () => null }));
vi.mock("@/components/banner-html-frame", () => ({ BannerHtmlFrame: () => null }));
vi.mock("@/components/profile-seals", () => ({ ProfileSeals: () => null }));

const mod = await import("./perfil.$username");
// `Profile` é interno do módulo; o componente registrado na rota é o caminho público de teste.
const Profile = (mod.Route as unknown as { options: { component?: () => ReactNode } }).options
  .component;
if (!Profile) throw new Error("componente da rota /perfil/$username não encontrado");

const usuario = (id: string): Record<string, unknown> => ({
  id,
  name: "Ana Souza",
  username: "ana",
  createdAt: "2026-01-01T00:00:00Z",
  skills: [],
  goals: [],
  experiences: [],
  externalLinks: [],
});

let meuId = "eu_1";

vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ user: { id: meuId }, requireAuth: vi.fn() }),
}));

describe("a própria foto do perfil é clicável (#933)", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <ToastProvider>
            <Profile />
          </ToastProvider>
        </QueryClientProvider>,
      );
    });
    await settle();
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.getProfile.mockReset();
    mocks.clickAvatarInput.mockReset();
    mocks.getProfile.mockResolvedValue(usuario(meuId));
    dadosDaRota.user = usuario(meuId);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("no próprio perfil, a foto é um botão que abre o seletor de imagem", async () => {
    await render();

    const botao = host.querySelector('button[aria-label="Trocar foto do perfil"]');
    expect(botao).not.toBeNull();

    // O botão dispara o mesmo input escondido do menu "Editar perfil".
    const input = host.querySelector('input[type="file"][accept="image/*"]');
    const estalou = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(function (this: HTMLInputElement) {});
    act(() => {
      botao?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(estalou).toHaveBeenCalled();
    estalou.mockRestore();
  });

  it("em perfil alheio, a foto não é botão e o avatar padrão permanece", async () => {
    meuId = "outra_pessoa";
    await render();

    expect(host.querySelector('button[aria-label="Trocar foto do perfil"]')).toBeNull();
    // Avatar padrão do design system (iniciais, fixture sem foto).
    expect(host.textContent).toContain("AS");
    meuId = "eu_1";
  });
});
