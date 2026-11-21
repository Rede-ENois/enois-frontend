// @vitest-environment jsdom
import type { PdfDocumentLike } from "@/types/pdf/pdf-document-like";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mountPdfReader } from "./mount-pdf-reader";

function createFakePdf(numPages = 3): PdfDocumentLike {
  return {
    numPages,
    getPage: vi.fn(async () => ({
      getViewport: ({ scale }: { scale: number }) => ({
        width: 600 * scale,
        height: 800 * scale,
      }),
      render: () => ({ promise: Promise.resolve() }),
    })),
    destroy: vi.fn(),
  };
}

describe("mountPdfReader", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renderiza paginação, zoom, modos de conforto e atualiza página ao navegar", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const fakePdf = createFakePdf(3);

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const cleanup = mountPdfReader(host, {
      url: "https://cdn.example.com/guia-redes.pdf",
      fileName: "guia-redes.pdf",
      loadPdf: async () => fakePdf,
    });

    await vi.waitFor(() => {
      expect(host.querySelector("[data-pdf-page-total]")?.textContent).toBe("de 3");
    });

    const prev = host.querySelector<HTMLButtonElement>('[data-pdf-control="prev"]')!;
    const next = host.querySelector<HTMLButtonElement>('[data-pdf-control="next"]')!;
    const sepia = host.querySelector<HTMLButtonElement>('[data-pdf-tone-btn="sepia"]')!;
    const dark = host.querySelector<HTMLButtonElement>('[data-pdf-tone-btn="dark"]')!;
    const stage = host.querySelector<HTMLElement>("[data-pdf-stage]")!;

    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    next.click();
    await vi.waitFor(() => {
      expect(fakePdf.getPage).toHaveBeenCalledWith(2);
    });
    expect(prev.disabled).toBe(false);

    sepia.click();
    expect(stage.getAttribute("data-pdf-tone")).toBe("sepia");
    expect(sepia.getAttribute("aria-pressed")).toBe("true");

    dark.click();
    expect(stage.getAttribute("data-pdf-tone")).toBe("dark");
    expect(dark.getAttribute("aria-pressed")).toBe("true");

    cleanup();
    expect(fakePdf.destroy).toHaveBeenCalled();
  });

  it("exibe fallback com links diretos quando o PDF falha ao carregar", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    const cleanup = mountPdfReader(host, {
      url: "https://externo.example.com/aula.pdf",
      fileName: "aula.pdf",
      loadPdf: async () => {
        throw new Error("CORS blocked");
      },
    });

    await vi.waitFor(() => {
      const fallback = host.querySelector<HTMLElement>("[data-pdf-fallback]");
      expect(fallback?.hidden).toBe(false);
    });

    cleanup();
  });
});
