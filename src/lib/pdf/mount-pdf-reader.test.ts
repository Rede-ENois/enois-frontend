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

    const continuousBtn = host.querySelector<HTMLButtonElement>(
      '[data-pdf-layout-btn="continuous"]',
    )!;
    continuousBtn.click();
    expect(continuousBtn.getAttribute("aria-pressed")).toBe("true");
    await vi.waitFor(() => {
      expect(host.querySelectorAll("[data-pdf-continuous-list] canvas")).toHaveLength(3);
    });

    cleanup();
    expect(fakePdf.destroy).toHaveBeenCalled();
  });

  it("suporta alternância entre modo de leitura confortável (Leitura) e ajuste à largura", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const fakePdf = createFakePdf(2);

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const cleanup = mountPdfReader(host, {
      url: "https://cdn.example.com/artigo.pdf",
      fileName: "artigo.pdf",
      loadPdf: async () => fakePdf,
    });

    await vi.waitFor(() => {
      expect(host.querySelector("[data-pdf-zoom-label]")?.textContent).toBe("Largura");
    });

    const fitBtn = host.querySelector<HTMLButtonElement>('[data-pdf-control="fit"]')!;
    const comfortBtn = host.querySelector<HTMLButtonElement>('[data-pdf-control="comfort"]')!;
    const zoomStatus = host.querySelector<HTMLElement>("[data-pdf-zoom-label]")!;
    const stage = host.querySelector<HTMLElement>("[data-pdf-stage]")!;

    expect(fitBtn.getAttribute("aria-pressed")).toBe("true");
    expect(comfortBtn.getAttribute("aria-pressed")).toBe("false");

    // Ativa modo conforto de leitura (Leitura)
    comfortBtn.click();
    expect(comfortBtn.getAttribute("aria-pressed")).toBe("true");
    expect(fitBtn.getAttribute("aria-pressed")).toBe("false");
    expect(zoomStatus.textContent).toBe("Leitura");

    // Volta para Ajustar
    fitBtn.click();
    expect(fitBtn.getAttribute("aria-pressed")).toBe("true");
    expect(comfortBtn.getAttribute("aria-pressed")).toBe("false");
    expect(zoomStatus.textContent).toBe("Largura");

    // Double tap no stage alterna para modo conforto
    stage.dispatchEvent(new MouseEvent("pointerup", { button: 0, bubbles: true }));
    stage.dispatchEvent(new MouseEvent("pointerup", { button: 0, bubbles: true }));
    expect(comfortBtn.getAttribute("aria-pressed")).toBe("true");
    expect(zoomStatus.textContent).toBe("Leitura");

    cleanup();
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
