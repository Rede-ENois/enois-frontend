// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { StudyPairProposalView } from "@/types/application/study-pairs/study-pair-proposal-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { StudyPairProposals } from "./study-pair-proposals";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  accept: vi.fn(),
  decline: vi.fn(),
  icebreakers: vi.fn(),
  me: vi.fn(),
}));

vi.mock("@rede-enois/design-system/ui", () => ({
  Button: ({ children, ...props }: { children?: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("@/lib/api", async () => ({
  ApiError: (await import("@/lib/api-client")).ApiError,
  studyPairsApi: {
    me: mocks.me,
    accept: mocks.accept,
    decline: mocks.decline,
    icebreakers: mocks.icebreakers,
  },
}));

const proposal = (overrides: Partial<StudyPairProposalView> = {}): StudyPairProposalView => ({
  id: "sp_1",
  goal: "Aprender Rust",
  goalKey: "aprender-rust",
  topic: null,
  partner: { id: "user_ada", username: "ada", name: "Ada", avatar: null },
  myAccepted: false,
  partnerAccepted: false,
  partnerIcebreaker: null,
  deadline: "2026-11-26T12:00:00Z",
  ...overrides,
});

const catalog = {
  items: [
    {
      id: "ice_why_now",
      position: 1,
      question: "Por que esse objetivo agora?",
      required: true,
      kind: "TEXT",
      options: [],
    },
    {
      id: "ice_weekly_time",
      position: 2,
      question: "Quanto tempo por semana?",
      required: false,
      kind: "SINGLE",
      options: ["Até 1 hora", "2 a 3 horas"],
    },
  ],
};

describe("StudyPairProposals", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = async () => {
    for (let i = 0; i < 5; i += 1) {
      await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
    }
  };
  const button = (label: string) =>
    [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);

  const mount = async (proposals: StudyPairProposalView[]) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <StudyPairProposals proposals={proposals} />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.toast.mockReset();
    mocks.me.mockReset().mockResolvedValue({ openRequest: null, proposals: [], pairs: [] });
    mocks.accept.mockReset().mockResolvedValue({ pairActive: false });
    mocks.decline.mockReset().mockResolvedValue({ id: "sp_1", status: "DECLINED" });
    mocks.icebreakers.mockReset().mockResolvedValue(catalog);
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

  it("renders nothing without proposals", async () => {
    await mount([]);
    expect(host.textContent).toBe("");
    expect(mocks.icebreakers).not.toHaveBeenCalled();
  });

  it("asks the required icebreaker before accepting", async () => {
    await mount([proposal()]);

    await act(async () => button("Aceitar")!.click());
    await settle();
    expect(mocks.accept).not.toHaveBeenCalled();
    expect(host.querySelector("[role=alert]")?.textContent).toContain("obrigatória");

    const text = host.querySelector("textarea") as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(text) as object,
      "value",
    )!.set!;
    await act(async () => {
      setter.call(text, "Quero trocar de área.");
      text.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => button("Aceitar")!.click());
    await settle();

    expect(mocks.accept).toHaveBeenCalledWith("sp_1", { ice_why_now: "Quero trocar de área." });
  });

  it("lists the partner's icebreaker only when the server reveals it", async () => {
    await mount([proposal()]);
    expect(host.textContent).not.toContain("O quebra-gelo de");

    await act(async () => root.unmount());
    root = createRoot(host);
    await mount([
      proposal({
        partnerIcebreaker: { ice_why_now: "Voltar a programar." },
        partnerAccepted: true,
      }),
    ]);
    expect(host.textContent).toContain("O quebra-gelo de Ada");
    expect(host.textContent).toContain("Voltar a programar.");
  });

  it("declines and tells the person they are back in the queue", async () => {
    await mount([proposal()]);
    await act(async () => button("Recusar")!.click());
    await settle();

    expect(mocks.decline).toHaveBeenCalledWith("sp_1");
    expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining("volta para a fila"));
  });

  it("shows the server's reason when accepting is refused", async () => {
    mocks.accept.mockRejectedValue(new ApiError(409, "STUDY_PAIR_EXPIRED", "Proposta vencida."));
    await mount([proposal({ myAccepted: false })]);
    const text = host.querySelector("textarea") as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(text) as object,
      "value",
    )!.set!;
    await act(async () => {
      setter.call(text, "Porque sim.");
      text.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => button("Aceitar")!.click());
    await settle();

    expect(mocks.toast).toHaveBeenCalledWith("Proposta vencida.", "error");
  });
});
