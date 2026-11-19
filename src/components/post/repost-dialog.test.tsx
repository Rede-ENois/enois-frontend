// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RepostDialog } from "./repost-dialog";

const toast = vi.fn();
const repostRequest = vi.hoisted(() => vi.fn());
const repostCommunityRequest = vi.hoisted(() => vi.fn());
const mineRequest = vi.hoisted(() => vi.fn());

vi.mock("@rede-enois/design-system/ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@rede-enois/design-system/ui");
  return {
    ...actual,
    useToast: () => ({ toast }),
  };
});
vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  reactionsApi: {
    repost: repostRequest,
    repostToCommunity: repostCommunityRequest,
    undoRepost: vi.fn(),
  },
}));
vi.mock("@/lib/query-options/communities", () => ({
  communityQueries: {
    mine: () => ({ queryKey: ["communities", "mine", { limit: 50 }], queryFn: mineRequest }),
  },
}));
vi.mock("@/lib/feed/post-query-cache", () => ({
  refreshFeedFirstPage: () => {},
  updatePostInQueryCache: () => {},
}));

// React lê o valor pelo rastreio nativo: sem o setter do protótipo, o onChange não dispara.
function dispararValor(el: HTMLSelectElement | HTMLTextAreaElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLSelectElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

const comunidades = {
  items: [
    { id: "comm_a", name: "Fotografia" },
    { id: "comm_b", name: "Ciclismo urbano" },
  ],
};

describe("RepostDialog: republicar na comunidade", () => {
  let root: Root;
  let host: HTMLDivElement;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    toast.mockReset();
    repostCommunityRequest.mockReset().mockResolvedValue({});
    mineRequest.mockReset().mockResolvedValue(comunidades);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    qc.clear();
    host.remove();
    vi.unstubAllGlobals();
  });

  const render = () =>
    act(() =>
      root.render(
        <QueryClientProvider client={qc}>
          <RepostDialog postId="post_1" reposted={false} open onOpenChange={() => {}} />
        </QueryClientProvider>,
      ),
    );
  const botao = (rotulo: string) =>
    [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((b) =>
      b.textContent?.includes(rotulo),
    );

  it("manda communityId e comentário quando publica na comunidade escolhida", async () => {
    render();
    await act(async () => {
      await vi.waitFor(() => {
        if (!botao("Republicar na comunidade")) throw new Error("porta ainda ausente");
      });
    });

    act(() => botao("Republicar na comunidade")!.click());

    const select = document.body.querySelector<HTMLSelectElement>("select")!;
    act(() => dispararValor(select, "comm_a"));
    const textarea = document.body.querySelector<HTMLTextAreaElement>("textarea")!;
    act(() => dispararValor(textarea, "Que foto boa!"));

    const publicar = [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((b) =>
      b.textContent?.includes("Publicar"),
    )!;
    expect(publicar.disabled).toBe(false);
    await act(() => publicar.click());

    expect(repostCommunityRequest).toHaveBeenCalledWith("post_1", "comm_a", "Que foto boa!");
    expect(toast).toHaveBeenCalledWith("Republicado na comunidade.", "success");
  });

  it("feed pertence ao feed normal: porta de comunidade some sem comunidades", async () => {
    mineRequest.mockResolvedValue({ items: [] });
    render();
    await act(async () => {
      await vi.waitFor(() => expect(mineRequest).toHaveBeenCalled());
    });

    expect(document.body.textContent).not.toContain("Republicar na comunidade");
  });
});
