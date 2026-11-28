// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O interruptor "Sou recrutador" nos dois lugares em que ele aparece: no próprio perfil e na banca
 * vazia de quem ainda não ligou o modo. O interruptor em si é testado em
 * `components/profile/recruiter-mode-switch.test.tsx`; aqui importa que ele esteja na tela — e que
 * o banco vazio deixe de desviar a pessoa para o perfil para dizer "ative no perfil".
 */

const mocks = vi.hoisted(() => ({ meId: "u-dono" as string | null }));

const perfilCarregado = {
  user: {
    id: "u-dono",
    username: "ana",
    name: "Ana Souza",
    banido: false,
    skills: [],
    goals: [],
    externalLinks: [],
  },
};

vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@rede-enois/design-system/ui", async () => {
  const real = await vi.importActual<typeof import("@rede-enois/design-system/ui")>(
    "@rede-enois/design-system/ui",
  );
  return { ...real, useToast: () => ({ toast: vi.fn() }) };
});

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  useLoaderData: () => perfilCarregado,
  useNavigate: () => () => undefined,
  useSearch: () => ({}),
  useParams: () => ({}),
  useMatchRoute: () => () => false,
  useRouterState: () => ({
    location: { pathname: "/", search: "", hash: "", state: undefined },
    matches: [],
  }),
  Link: (props: Record<string, React.ReactNode>) => <a>{props.children}</a>,
  Outlet: () => null,
  notFound: () => undefined,
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  hasSessionFlag: () => true,
}));
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ user: mocks.meId ? { id: mocks.meId } : null, requireAuth: () => undefined }),
  useIsAuthenticated: () => mocks.meId !== null,
}));
vi.mock("@/lib/use-professional-identity", () => ({
  useProfessionalIdentity: () => ({ applicant: null, professionalSetupHref: null }),
}));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ status: "idle", progress: 0, upload: vi.fn(), uploadAll: vi.fn() }),
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
    me: vi.fn().mockResolvedValue({ id: "u-dono", username: "ana", isRecruiter: false }),
    update: vi.fn().mockResolvedValue({}),
  },
  rankingApi: {},
  recommendationsApi: {},
  talentBanksApi: { owned: vi.fn().mockRejectedValue(new Error("sem banca")) },
  authApi: { me: vi.fn().mockResolvedValue(null) },
}));
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: () => null }));
vi.mock("@/components/edit-profile-dialog", () => ({ EditProfileDialog: () => null }));
const Stub = ({ children }: { children?: React.ReactNode }) => <>{children ?? null}</>;
vi.mock("@/components/appearance/appearance-dialog", () => ({ AppearanceDialog: Stub }));
vi.mock("@/components/appearance/profile-look-dialog", () => ({ ProfileLookDialog: Stub }));
vi.mock("@/components/banner-html-frame", () => ({ BannerHtmlFrame: Stub }));
vi.mock("@/components/block-user-dialog", () => ({ BlockUserDialog: Stub }));
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

const { Route: PerfilRoute } = await import("./perfil.$username");
// O perfil lê `Route.useLoaderData` no módulo: a rota falsa precisa ter o campo.
Object.assign(PerfilRoute, { useLoaderData: () => perfilCarregado });
const { Route: BancosRoute } = await import("./recrutador.bancos");
const pagina = (route: unknown) =>
  (route as { options: { component: () => React.JSX.Element } }).options.component;
const Perfil = pagina(PerfilRoute);
const Bancos = pagina(BancosRoute);

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

async function render(Component: () => React.JSX.Element) {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Component />
      </QueryClientProvider>,
    );
  });
  for (let i = 0; i < 12; i += 1) await settle();
}

/** Só o texto que está na tela, sem os comentários do código-fonte. */
function texto() {
  return (host.textContent ?? "").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
}

/** O interruptor tem o rótulo "Sou recrutador" na mesma caixa do Switch. */
function interruptorDeRecrutador() {
  return [...host.querySelectorAll('[role="switch"]')].filter((toggle) => {
    const label = toggle.parentElement?.querySelector("label");
    return label?.textContent === "Sou recrutador";
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.meId = "u-dono";
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
  vi.clearAllMocks();
});

describe('Interruptor "Sou recrutador" nas telas', () => {
  it("aparece no próprio perfil", async () => {
    await render(Perfil);

    expect(interruptorDeRecrutador()).toHaveLength(1);
  });

  it("aparece na banca vazia de quem não é recrutador", async () => {
    await render(Bancos);

    expect(texto()).toContain("Ative o modo recrutador");
    expect(interruptorDeRecrutador()).toHaveLength(1);
  });
});
