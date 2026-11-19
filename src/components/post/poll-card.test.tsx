// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PollView } from "@/types/application/feed/poll-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizePollOptions } from "@/lib/feed/poll-options";

import { PollCard } from "./poll-card";
import { PollComposer } from "./poll-composer";

const mocks = vi.hoisted(() => ({ votePoll: vi.fn(), toast: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/lib/api", () => ({ feedApi: { votePoll: mocks.votePoll } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: { id: "u1" } }),
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("@rede-enois/design-system/domain", async (importOriginal) => ({
  ...(await importOriginal<object>()),
}));

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(node: React.ReactNode) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.invalidateQueries = mocks.invalidate;
  act(() => {
    root?.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
  });
}

const poll = (overrides: Partial<PollView> = {}): PollView => ({
  options: ["Café", "Chá"],
  counts: [0, 0],
  myVotes: [],
  totalVotes: 0,
  multipleChoice: false,
  endsAt: null,
  ...overrides,
});

function renderCard(current: PollView) {
  mount(
    <PollCard
      post={{
        id: "post_poll1",
        type: "POLL",
        content: "Café ou chá?",
        authorId: "outro",
        authorUsername: "ana",
        authorName: "Ana",
        authorAvatar: null,
        tags: [],
        mediaIds: [],
        createdAt: "2026-10-30T12:00:00Z",
        visibility: "PUBLIC",
        counters: { reactions: 0, comments: 0, saves: 0, shares: 0, reposts: 0 },
        status: "ACTIVE",
        poll: current,
      }}
    />,
  );
}

describe("enquete no card do feed", () => {
  beforeEach(() => {
    root = null;
    host = null;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
  });

  it("mostra as alternativas antes do voto", () => {
    renderCard(poll());
    expect(host?.querySelectorAll("button").length).toBe(2);
    expect(host?.textContent).toContain("Café");
    expect(mocks.votePoll).not.toHaveBeenCalled();
  });

  it("escolha única: o clique registra o voto e o resultado entra no lugar", async () => {
    mocks.votePoll.mockResolvedValue(poll({ counts: [1, 0], myVotes: [0], totalVotes: 1 }));
    renderCard(poll());
    await act(async () => {
      host?.querySelector("button")?.click();
      await Promise.resolve();
    });
    expect(mocks.votePoll).toHaveBeenCalledWith("post_poll1", { option: 0 });
    expect(host?.textContent).toContain("1 voto");
    expect(host?.textContent).toContain("100%");
  });

  it("troca de voto: volta às alternativas e manda o novo voto", async () => {
    mocks.votePoll
      .mockResolvedValueOnce(poll({ counts: [1, 0], myVotes: [0], totalVotes: 1 }))
      .mockResolvedValueOnce(poll({ counts: [0, 1], myVotes: [1], totalVotes: 1 }));
    renderCard(poll());
    await act(async () => {
      host?.querySelector("button")?.click();
      await Promise.resolve();
    });
    const trocar = [...(host?.querySelectorAll("button") ?? [])].find(
      (botao) => botao.textContent === "Trocar voto",
    );
    await act(async () => {
      trocar?.click();
    });
    await act(async () => {
      host?.querySelectorAll("button")[1]?.click();
      await Promise.resolve();
    });
    expect(mocks.votePoll).toHaveBeenLastCalledWith("post_poll1", { option: 1 });
    expect(host?.textContent).toContain("Chá");
  });

  it("múltipla escolha: marca alternativas e confirma a lista", async () => {
    mocks.votePoll.mockResolvedValue(
      poll({
        options: ["A", "B", "C"],
        counts: [1, 0, 1],
        myVotes: [0, 2],
        totalVotes: 1,
        multipleChoice: true,
      }),
    );
    renderCard(poll({ options: ["A", "B", "C"], multipleChoice: true }));
    const botoes = [...(host?.querySelectorAll("button") ?? [])];
    await act(async () => {
      botoes[0]?.click();
      botoes[2]?.click();
    });
    // Marcar não vota: só o confirmar manda a lista.
    expect(mocks.votePoll).not.toHaveBeenCalled();
    const confirmar = [...(host?.querySelectorAll("button") ?? [])].find(
      (botao) => botao.textContent === "Confirmar voto",
    );
    await act(async () => {
      confirmar?.click();
      await Promise.resolve();
    });
    expect(mocks.votePoll).toHaveBeenCalledWith("post_poll1", { options: [0, 2] });
  });

  it("enquete encerrada mostra o resultado sem gesto de voto", () => {
    renderCard(
      poll({ counts: [2, 1], totalVotes: 3, endsAt: new Date(Date.now() - 60_000).toISOString() }),
    );
    expect(host?.querySelectorAll("button").length).toBe(0);
    expect(host?.textContent).toContain("Encerrada em");
    expect(host?.textContent).toContain("3 votos");
  });

  it("409 de prazo: toast próprio e recarrega o estado real", async () => {
    mocks.votePoll.mockRejectedValue(new Error("O prazo desta enquete terminou."));
    renderCard(poll());
    await act(async () => {
      host?.querySelector("button")?.click();
      await Promise.resolve();
    });
    expect(mocks.toast).toHaveBeenCalledWith("O prazo desta enquete terminou.", "error");
    expect(mocks.invalidate).toHaveBeenCalled();
  });
});

describe("controles do composer", () => {
  it("múltipla escolha e prazo passam pelos callbacks", () => {
    const onMultipleChoiceChange = vi.fn();
    const onEndsAtChange = vi.fn();
    const local = document.createElement("div");
    document.body.appendChild(local);
    const raiz = createRoot(local);
    act(() => {
      raiz.render(
        <PollComposer
          options={["A", "B"]}
          onChange={vi.fn()}
          onMultipleChoiceChange={onMultipleChoiceChange}
          onEndsAtChange={onEndsAtChange}
        />,
      );
    });
    act(() => {
      (local.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    });
    expect(onMultipleChoiceChange).toHaveBeenCalledWith(true);
    const campo = local.querySelector("#enquete-prazo") as HTMLInputElement;
    const digitar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    act(() => {
      digitar?.call(campo, "2026-12-01T10:30");
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect((onEndsAtChange.mock.calls[0][0] as string).endsWith("Z")).toBe(true);
    act(() => raiz.unmount());
    local.remove();
  });
});

describe("alternativas do composer", () => {
  it("normaliza: tira vazio, repetido e o excesso do teto", () => {
    const options = normalizePollOptions(["Café", "  ", "café ", "Chá", "a", "b", "c", "d"]);
    expect(options).toEqual(["Café", "Chá", "a", "b", "c", "d"]);
  });
});
