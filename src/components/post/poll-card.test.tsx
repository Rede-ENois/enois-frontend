// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizePollOptions } from "@/lib/feed/poll-options";

import { PollCard } from "./poll-card";
import { PollComposer } from "./poll-composer";

const mocks = vi.hoisted(() => ({ votePoll: vi.fn() }));
vi.mock("@/lib/api", () => ({ feedApi: { votePoll: mocks.votePoll } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: { id: "u1" } }),
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@rede-enois/design-system/domain", () => ({}));

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(node: React.ReactNode) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root?.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
  });
}

function render(poll: {
  options: string[];
  counts: number[];
  myVote: number | null;
  totalVotes: number;
}) {
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
        counters: { reactions: 0, comments: 0, saves: 0, shares: 0 },
        status: "ACTIVE",
        poll,
      }}
    />,
  );
}

describe("enquete no card", () => {
  beforeEach(() => {
    root = null;
    host = null;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
  });

  it("mostra alternativas como botões antes do voto", () => {
    render({ options: ["Café", "Chá"], counts: [0, 0], myVote: null, totalVotes: 0 });
    const buttons = host?.querySelectorAll("button");
    expect(buttons?.length).toBe(2);
    expect(host?.textContent).toContain("Café");
    expect(host?.textContent).toContain("Nenhum voto ainda");
  });

  it("vota uma vez e passa a mostrar o resultado com a escolha marcada", async () => {
    mocks.votePoll.mockResolvedValue({
      options: ["Café", "Chá"],
      counts: [1, 0],
      myVote: 0,
      totalVotes: 1,
    });
    render({ options: ["Café", "Chá"], counts: [0, 0], myVote: null, totalVotes: 0 });
    const button = host?.querySelector("button");
    await act(async () => {
      button?.click();
      // `mutate` do TanStack Query roda a mutação no próximo tick: deixa o promise resolver.
      await Promise.resolve();
    });
    expect(mocks.votePoll).toHaveBeenCalledWith("post_poll1", 0);
    expect(host?.textContent).toContain("1 voto");
    expect(host?.textContent).toContain("100%");
    expect(host?.querySelectorAll("button").length).toBe(0);
  });
});

describe("alternativas do composer", () => {
  it("normaliza: tira vazio, repetido e o excesso do teto", () => {
    const options = normalizePollOptions(["Café", "  ", "café ", "Chá", "a", "b", "c", "d"]);
    expect(options).toEqual(["Café", "Chá", "a", "b", "c", "d"]);
  });

  it("manda remover a alternativa só quando há mais de duas", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const onChange = vi.fn();
    act(() => {
      root.render(<PollComposer options={["A", "B"]} onChange={onChange} />);
    });
    expect(host.querySelectorAll('button[aria-label="Remover alternativa"]').length).toBe(0);
    act(() => {
      root.unmount();
    });
    host.remove();
  });
});
