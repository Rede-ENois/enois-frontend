import type { PdfLoader } from "@/types/pdf/pdf-loader";

import { loadPdfDocument } from "./load-pdf-document";

/**
 * Monta o cartão visual de anexo PDF com miniatura real da primeira página, contagem de páginas
 * e convite claro para abrir o leitor confortável.
 */
export function mountPdfThumbnail(
  host: HTMLElement,
  options: { url: string; title: string; file?: File; loadPdf?: PdfLoader },
): () => void {
  const { url, title, file, loadPdf = loadPdfDocument } = options;
  let disposed = false;
  let docToDestroy: { destroy?: () => Promise<void> | void } | null = null;

  const wrapper = document.createElement("span");
  wrapper.setAttribute("data-pdf-card-body", "true");

  const thumbBox = document.createElement("span");
  thumbBox.setAttribute("data-pdf-thumb-box", "true");

  const fallbackBadge = document.createElement("span");
  fallbackBadge.setAttribute("data-pdf-thumb-fallback", "true");
  fallbackBadge.textContent = "PDF";

  const canvas = document.createElement("canvas");
  canvas.setAttribute("data-pdf-thumb-canvas", "true");
  canvas.hidden = true;
  thumbBox.append(fallbackBadge, canvas);

  const meta = document.createElement("span");
  meta.setAttribute("data-pdf-card-meta", "true");

  const topRow = document.createElement("span");
  topRow.setAttribute("data-pdf-card-top", "true");

  const pill = document.createElement("span");
  pill.setAttribute("data-pdf-card-pill", "true");
  pill.textContent = "PDF";

  const pagesLabel = document.createElement("span");
  pagesLabel.setAttribute("data-pdf-card-pages", "true");
  pagesLabel.textContent = "Documento";
  topRow.append(pill, pagesLabel);

  const titleEl = document.createElement("span");
  titleEl.setAttribute("data-pdf-card-title", "true");
  titleEl.textContent = title;

  const cta = document.createElement("span");
  cta.setAttribute("data-pdf-card-cta", "true");
  cta.textContent = "Toque para ler no modo confortável →";

  meta.append(topRow, titleEl, cta);
  wrapper.append(thumbBox, meta);
  host.append(wrapper);

  void loadPdf(url, file)
    .then(async (doc) => {
      if (disposed) {
        void doc.destroy?.();
        return;
      }
      docToDestroy = doc;
      const total = Math.max(1, doc.numPages);
      pagesLabel.textContent = total === 1 ? "1 página" : `${total} páginas`;

      const page = await doc.getPage(1);
      if (disposed) return;

      const base = page.getViewport({ scale: 1 });
      const targetWidth = 84;
      const scale = targetWidth / Math.max(1, base.width);
      const viewport = page.getViewport({ scale });
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

      canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
      canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      try {
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === "RenderingCancelledException") {
          return;
        }
        throw error;
      }
      if (disposed) return;

      fallbackBadge.hidden = true;
      canvas.hidden = false;
    })
    .catch(() => {
      // Sem prévia (ex.: CORS externo): mantém o selo PDF elegante no lugar da miniatura.
    });

  return () => {
    disposed = true;
    void docToDestroy?.destroy?.();
    wrapper.remove();
  };
}
