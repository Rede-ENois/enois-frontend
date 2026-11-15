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

/** Caminho do proxy, igual ao que `GET /emotes/index` devolve. */
const KEKW = "/emotes/image/BTTV/abc123?variant=full";

/**
 * As alternativas passam pelo RichText, que busca o índice de figurinhas: um `fetch` falso devolve
 * o mesmo formato do backend para testar o caminho de verdade (índice → código → imagem).
 */
function fakeFetch(input: RequestInfo | URL) {
  const url = new URL(String(input), "http://localhost");
  if (!url.pathname.endsWith("/emotes/index")) {
    return resposta({ code: undefined, message: undefined }, false);
  }
  return resposta({ entries: { KEKW }, generatedAt: "2026-10-29T00:00:00Z" });
}

/** Resposta mínima que o cliente da API entende: ele lê `text()` antes do `JSON.parse`. */
function resposta(body: unknown, ok = true) {
  const texto = JSON.stringify(body);
  return {
    ok,
    status: ok ? 200 : 503,
    statusText: ok ? "OK" : "Service Unavailable",
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => texto,
    json: async () => body,
  };
}

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
        counters: { reactions: 0, comments: 0, saves: 0, shares: 0, reposts: 0 },
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
    // O índice de figurinhas é guardado no `localStorage`: sem limpar, cópia de outro teste vaza.
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(fakeFetch));
  });

  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
    vi.unstubAllGlobals();
  });

  async function esperaIndiceDeEmotes() {
    // O índice chega por promise: sem esperar, o primeiro desenho ainda mostra o código cru.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  }

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

  it("a alternativa com código de figurinha vira imagem, antes e depois do voto", async () => {
    mocks.votePoll.mockResolvedValue({
      options: ["Café :KEKW:", "Chá"],
      counts: [1, 0],
      myVote: 0,
      totalVotes: 1,
    });
    render({ options: ["Café :KEKW:", "Chá"], counts: [0, 0], myVote: null, totalVotes: 0 });
    await esperaIndiceDeEmotes();

    const figurinha = () => host?.querySelector(`img[src*="${KEKW}"]`);
    expect(figurinha()).not.toBeNull();
    // As duas alternativas continuam botões de voto; "Chá" segue texto puro, sem imagem.
    expect(host?.querySelectorAll("button").length).toBe(2);

    const button = host?.querySelector("button");
    await act(async () => {
      button?.click();
      await Promise.resolve();
    });
    await esperaIndiceDeEmotes();

    // Depois do voto o resultado mantém a figurinha da alternativa escolhida.
    expect(figurinha()).not.toBeNull();
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
