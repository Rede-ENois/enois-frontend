// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { LinkPreview } from "@/types/application/link-preview/link-preview";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LinkPreviewCard } from "./link-preview-card";

/** Fixa a origem "do site" no teste: sem isso o host é o placeholder do jsdom, e um link do
 * Énóis não seria reconhecido como página interna. */
vi.mock("@/lib/api/client-origin", () => ({ clientOrigin: () => "https://enois.ia.br" }));

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/api", () => ({ linkPreviewsApi: { get: mocks.get } }));

// O router não monta num teste de componente: o link interno vira uma âncora com o caminho, que é
// justamente o que a navegação dentro do app vai seguir.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

async function mount(node: React.ReactNode, client = new QueryClient()) {
  await act(async () => {
    root = createRoot(host!);
    root.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
  });
  // A consulta é assíncrona: dá tempo de a resposta aceita chegar e a tela redesenhar.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  mocks.get.mockReset();
});

const external: LinkPreview = {
  kind: "EXTERNAL",
  url: "https://exemplo.com/materia",
  title: "Uma matéria sobre testes",
  description: "O resumo que o site declara para compartilhamento.",
  imageUrl: "https://exemplo.com/capa.png",
  siteName: "Exemplo",
};

const internal: LinkPreview = {
  kind: "INTERNAL",
  url: "https://enois.ia.br/post/abc",
  title: "Mel no Énóis",
  description: "Um texto curto",
  imageUrl: null,
  siteName: "Post",
};

describe("LinkPreviewCard", () => {
  it("shows what the site declares: thumbnail, title, description and the button", async () => {
    mocks.get.mockResolvedValue({ preview: external });

    await mount(<LinkPreviewCard url="https://exemplo.com/materia" />);

    expect(host!.textContent).toContain("Uma matéria sobre testes");
    expect(host!.textContent).toContain("O resumo que o site declara");
    expect(host!.textContent).toContain("Abrir página completa");
    expect(host!.querySelector("img")?.getAttribute("src")).toBe("https://exemplo.com/capa.png");
    // Site de fora continua abrindo em outra aba.
    expect(host!.querySelector("a")?.getAttribute("target")).toBe("_blank");
    expect(mocks.get).toHaveBeenCalledWith("https://exemplo.com/materia");
  });

  it("opens a page of this app inside the router, not in a new tab", async () => {
    mocks.get.mockResolvedValue({ preview: internal });

    await mount(<LinkPreviewCard url="https://enois.ia.br/post/abc" />);

    const link = host!.querySelector("a");
    // O host do teste é um placeholder: o que importa é o caminho interno que o router segue.
    expect(link!.getAttribute("href")).toBe("/post/abc");
    expect(link?.hasAttribute("target")).toBe(false);
    expect(host!.textContent).toContain("Abrir no Énóis");
  });

  it("keeps the simple card when the site declares nothing", async () => {
    mocks.get.mockResolvedValue({ preview: null });

    await mount(<LinkPreviewCard url="https://sem-seo.exemplo/pagina" />);

    expect(host!.textContent).toContain("sem-seo.exemplo");
    expect(host!.textContent).toContain("Abrir página completa");
    expect(host!.querySelector("img")).toBeNull();
  });

  it("keeps the simple card when the preview request fails", async () => {
    mocks.get.mockRejectedValue(new Error("529"));

    await mount(<LinkPreviewCard url="https://fora-do-ar.exemplo/pagina" />);

    expect(host!.textContent).toContain("fora-do-ar.exemplo");
    expect(host!.querySelector("a")?.getAttribute("target")).toBe("_blank");
  });

  it("does not draw a thumbnail for an image address that is not http(s)", async () => {
    mocks.get.mockResolvedValue({
      preview: { ...external, imageUrl: "javascript:alert(1)" },
    });

    await mount(<LinkPreviewCard url="https://exemplo.com/materia" />);

    expect(host!.querySelector("img")).toBeNull();
    // O cartão continua: é a imagem que não pode aparecer.
    expect(host!.textContent).toContain("Uma matéria sobre testes");
  });

  it("asks for the app's page when the link is written as a relative path", async () => {
    mocks.get.mockResolvedValue({ preview: internal });

    await mount(<LinkPreviewCard url="/post/abc" />);

    expect(mocks.get).toHaveBeenCalledWith("https://enois.ia.br/post/abc");
  });

  it("reuses the answer of the same link between cards", async () => {
    mocks.get.mockResolvedValue({ preview: external });
    const client = new QueryClient();

    await mount(<LinkPreviewCard url="https://exemplo.com/materia" />, client);
    await act(async () => root?.unmount());
    await mount(<LinkPreviewCard url="https://exemplo.com/materia" />, client);

    expect(mocks.get).toHaveBeenCalledTimes(1);
  });
});
