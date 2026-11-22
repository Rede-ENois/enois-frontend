// @vitest-environment jsdom
import type { PdfDocumentLike } from "@/types/pdf/pdf-document-like";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mountPdfThumbnail } from "./mount-pdf-thumbnail";

describe("mountPdfThumbnail", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renderiza miniatura da página 1 e exibe a contagem de páginas", async () => {
    const host = document.createElement("button");
    document.body.append(host);

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const fakeDoc: PdfDocumentLike = {
      numPages: 14,
      getPage: vi.fn(async () => ({
        getViewport: ({ scale }: { scale: number }) => ({
          width: 600 * scale,
          height: 800 * scale,
        }),
        render: () => ({ promise: Promise.resolve() }),
      })),
      destroy: vi.fn(),
    };

    const cleanup = mountPdfThumbnail(host, {
      url: "https://cdn.example.com/estruturas.pdf",
      title: "Estruturas de Dados.pdf",
      loadPdf: async () => fakeDoc,
    });

    await vi.waitFor(() => {
      expect(host.querySelector("[data-pdf-card-pages]")?.textContent).toBe("14 páginas");
    });
    expect(host.querySelector<HTMLCanvasElement>("[data-pdf-thumb-canvas]")?.hidden).toBe(false);

    cleanup();
    expect(fakeDoc.destroy).toHaveBeenCalled();
  });

  it("mantém o cartão acessível e sem quebra quando a miniatura não pode ser carregada", async () => {
    const host = document.createElement("button");
    document.body.append(host);

    const cleanup = mountPdfThumbnail(host, {
      url: "https://externo.example.com/bloqueado.pdf",
      title: "Apostila.pdf",
      loadPdf: async () => {
        throw new Error("CORS");
      },
    });

    await vi.waitFor(() => {
      expect(host.querySelector("[data-pdf-card-title]")?.textContent).toBe("Apostila.pdf");
    });
    expect(host.querySelector<HTMLElement>("[data-pdf-thumb-fallback]")?.hidden).toBe(false);

    cleanup();
  });
});
