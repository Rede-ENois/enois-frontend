// @vitest-environment jsdom
import type { PdfDocumentLike } from "@/types/pdf/pdf-document-like";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mountPdfReader } from "./mount-pdf-reader";

function createFakePdf(numPages = 3): PdfDocumentLike {
  return {
    numPages,
    getPage: vi.fn(async (pageNum: number) => ({
      getViewport: ({ scale }: { scale: number }) => ({
        width: 600 * scale,
        height: 800 * scale,
      }),
      render: () => ({ promise: Promise.resolve() }),
      getTextContent: async () => ({
        items: [
          {
            str: `Capítulo ${pageNum}: Arquitetura de Sistemas`,
            transform: [20, 0, 0, 20, 48, 740],
            height: 20,
            width: 320,
            hasEOL: true,
          },
          {
            str: "Este documento explica os conceitos fundamentais de redes e",
            transform: [12, 0, 0, 12, 48, 700],
            height: 12,
            width: 420,
            hasEOL: true,
          },
          {
            str: "sistemas distribuídos para leitura confortável no celular.",
            transform: [12, 0, 0, 12, 48, 684],
            height: 12,
            width: 380,
            hasEOL: true,
          },
          {
            str: "• Baixa latência e alta disponibilidade",
            transform: [12, 0, 0, 12, 56, 650],
            height: 12,
            width: 260,
            hasEOL: true,
          },
        ],
      }),
    })),
    destroy: vi.fn(),
  };
}

describe("mountPdfReader", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("extrai o conteúdo do PDF no modo Leitura fluida (títulos, parágrafos e listas) e navega entre páginas", async () => {
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
      expect(host.querySelector('[data-pdf-block="heading"]')?.textContent).toBe(
        "Capítulo 1: Arquitetura de Sistemas",
      );
    });

    // Une linhas do mesmo parágrafo para fluir naturalmente na largura da tela do celular
    expect(host.querySelector('[data-pdf-block="paragraph"]')?.textContent).toBe(
      "Este documento explica os conceitos fundamentais de redes e sistemas distribuídos para leitura confortável no celular.",
    );
    expect(host.querySelector('[data-pdf-block="list-item"]')?.textContent).toBe(
      "Baixa latência e alta disponibilidade",
    );

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
      expect(host.querySelector('[data-pdf-block="heading"]')?.textContent).toBe(
        "Capítulo 2: Arquitetura de Sistemas",
      );
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
      expect(
        host.querySelectorAll("[data-pdf-continuous-list] [data-pdf-reader-article]"),
      ).toHaveLength(3);
    });

    cleanup();
    expect(fakePdf.destroy).toHaveBeenCalled();
  });

  it("permite ajustar o tamanho da fonte no modo Leitura e alternar para a folha original (Ajustar)", async () => {
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
      expect(host.querySelector("[data-pdf-reader-article]")).not.toBeNull();
    });

    const fitBtn = host.querySelector<HTMLButtonElement>('[data-pdf-control="fit"]')!;
    const comfortBtn = host.querySelector<HTMLButtonElement>('[data-pdf-control="comfort"]')!;
    const zoomInBtn = host.querySelector<HTMLButtonElement>('[data-pdf-control="zoom-in"]')!;
    const zoomStatus = host.querySelector<HTMLElement>("[data-pdf-zoom-label]")!;

    expect(comfortBtn.getAttribute("aria-pressed")).toBe("true");
    expect(fitBtn.getAttribute("aria-pressed")).toBe("false");
    expect(zoomStatus.textContent).toBe("Leitura");

    // Aumenta o tamanho da fonte do texto fluido sem sair do modo Leitura
    zoomInBtn.click();
    expect(zoomStatus.textContent).toBe("Texto 115%");
    expect(comfortBtn.getAttribute("aria-pressed")).toBe("true");

    // Alterna para visualização da folha original ajustada à largura
    fitBtn.click();
    await vi.waitFor(() => {
      expect(fitBtn.getAttribute("aria-pressed")).toBe("true");
      expect(zoomStatus.textContent).toBe("Largura");
      expect(host.querySelector<HTMLElement>("[data-pdf-page-frame]")?.hidden).toBe(false);
    });

    // Volta para Modo Leitura fluida
    comfortBtn.click();
    await vi.waitFor(() => {
      expect(comfortBtn.getAttribute("aria-pressed")).toBe("true");
      expect(zoomStatus.textContent).toBe("Leitura");
      expect(host.querySelector<HTMLElement>("[data-pdf-reflow-slot]")?.hidden).toBe(false);
    });

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
