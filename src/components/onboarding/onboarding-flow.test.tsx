// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { OnboardingViewProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { OnboardingFlow } from "./onboarding-flow";

const mocks = vi.hoisted(() => ({
  starterPack: vi.fn(),
  complete: vi.fn(),
  skip: vi.fn(),
  navigate: vi.fn(),
  profile: { skills: ["React"] } as { skills: string[] } | undefined,
  view: null as OnboardingViewProps | null,
}));

vi.mock("@/lib/api", () => ({
  onboardingApi: { starterPack: mocks.starterPack, complete: mocks.complete, skip: mocks.skip },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: mocks.profile }) }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
// A view é só desenho; o teste guarda as props para conferir o contrato que o app cumpre.
vi.mock("@rede-enois/design-system/domain", () => ({
  OnboardingView: (props: OnboardingViewProps) => {
    mocks.view = props;
    return null;
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const view = () => mocks.view!;

const PACK = {
  communities: [
    {
      id: "c1",
      name: "Café",
      description: null,
      topic: "TECNOLOGIA",
      avatar: null,
      memberCount: 3,
    },
  ],
  groups: [
    {
      id: "g1",
      slug: "g",
      name: "G",
      description: "d",
      topic: null,
      avatar: null,
      memberCount: 1,
    },
  ],
  people: [
    { id: "p1", username: "ana", name: "Ana", headline: null, avatar: null },
    { id: "p2", username: "bia", name: "Bia", headline: "Dev", avatar: null },
  ],
};

describe("onboarding: contêiner", () => {
  let root: Root;
  let host: HTMLDivElement;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.profile = { skills: ["React"] };
    mocks.starterPack.mockResolvedValue(PACK);
    host = document.createElement("div");
    root = createRoot(host);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <OnboardingFlow />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(() => act(() => root.unmount()));

  it("marks the onboarding as shown only once the screen is on", () => {
    expect(sessionStorage.getItem("onboarding-shown")).toBe("1");
  });

  it("oferece os assuntos sem o filtro 'Todas', com rótulo, e semeia as habilidades do perfil", () => {
    expect(view().topics.some((topic) => topic.value === "Todas")).toBe(false);
    expect(view().topics.every((topic) => topic.label.length > 0)).toBe(true);
    expect(view().skills).toEqual(["React"]);
  });

  it("só pede o pacote no segundo passo e já chega com tudo marcado", async () => {
    expect(mocks.starterPack).not.toHaveBeenCalled();
    act(() => view().onToggleTopic("TECNOLOGIA"));
    act(() => view().onStepChange("pack"));
    await flush();

    expect(mocks.starterPack).toHaveBeenCalledWith(["TECNOLOGIA"], ["React"]);
    expect(view().communities[0].topicLabel).toBeTruthy();
    expect(view().selectedCommunityIds).toEqual(["c1"]);
    expect(view().selectedGroupIds).toEqual(["g1"]);
    expect(view().selectedPersonIds).toEqual(["p1", "p2"]);
  });

  it("conclui com o que ficou marcado, atualiza a sessão e vai para o feed", async () => {
    queryClient.setQueryData(["auth-me"], { id: "u", onboardingCompleted: false });
    mocks.complete.mockResolvedValue({ onboardingCompleted: true });
    act(() => view().onAddSkill("Fotografia"));
    act(() => view().onStepChange("pack"));
    await flush();
    act(() => view().onTogglePerson("p1"));
    act(() => view().onComplete());
    await flush();

    expect(mocks.complete).toHaveBeenCalledWith({
      topics: [],
      skills: ["React", "Fotografia"],
      communityIds: ["c1"],
      groupIds: ["g1"],
      connectUserIds: ["p2"],
    });
    expect(queryClient.getQueryData(["auth-me"])).toMatchObject({ onboardingCompleted: true });
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed", replace: true });
  });

  it("falha ao concluir mostra a mensagem e não sai da tela", async () => {
    mocks.complete.mockRejectedValue(new ApiError(409, "CONFLICTING_PREFERENCE", "raw"));
    act(() => view().onStepChange("pack"));
    await flush();
    act(() => view().onComplete());
    await flush();

    expect(view().errorMessage).toContain("Personalização");
    expect(view().submitting).toBe(false);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("falha do pacote vira estado de erro com nova tentativa", async () => {
    mocks.starterPack.mockRejectedValueOnce(new Error("offline"));
    act(() => view().onStepChange("pack"));
    await flush();
    expect(view().packError).toBe(true);

    act(() => view().onRetryPack());
    await flush();
    expect(view().packError).toBe(false);
    expect(view().people).toHaveLength(2);
  });

  it("pular sempre funciona e leva ao feed", async () => {
    mocks.skip.mockResolvedValue(undefined);
    act(() => view().onSkip());
    await flush();

    expect(mocks.skip).toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed", replace: true });
  });
});
