import type { PdfDocumentLike } from "@/types/pdf/pdf-document-like";
import type { PdfLoader } from "@/types/pdf/pdf-loader";
import type { PdfReadingTone } from "@/types/pdf/pdf-reading-tone";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 0.2;

async function defaultPdfLoader(url: string): Promise<PdfDocumentLike> {
  const [pdfjs, workerMod, response] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    fetch(url),
  ]);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
  }
  const data = new Uint8Array(await response.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  return (await task.promise) as unknown as PdfDocumentLike;
}

function makeButton(label: string, text: string, attr?: [string, string]): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.textContent = text;
  if (attr) btn.setAttribute(attr[0], attr[1]);
  return btn;
}

function makeActionLink(
  href: string,
  label: string,
  text: string,
  downloadName?: string,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = href;
  link.setAttribute("aria-label", label);
  link.title = label;
  link.textContent = text;
  link.setAttribute("data-pdf-action", "true");
  if (downloadName) {
    link.download = downloadName;
  } else {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  return link;
}

/**
 * Monta o leitor interativo de PDF dentro do elemento hospedeiro com zoom, ajuste à largura,
 * paginação acessível, modos de conforto visual (Original, Sépia, Noturno) e fallback caso o
 * servidor externo bloqueie CORS.
 */
export function mountPdfReader(
  host: HTMLElement,
  options: { url: string; fileName: string; loadPdf?: PdfLoader },
): () => void {
  const { url, fileName, loadPdf = defaultPdfLoader } = options;

  let disposed = false;
  let pdfDoc: PdfDocumentLike | null = null;
  let currentPage = 1;
  let totalPages = 0;
  let fitWidth = true;
  let manualScale = 1;
  let tone: PdfReadingTone = "normal";
  let activeRenderCancel: (() => void) | null = null;

  const root = document.createElement("div");
  root.setAttribute("data-pdf-reader-root", "true");

  // Barra superior: zoom, ajuste à largura, tom de leitura e download/nova aba.
  const toolbar = document.createElement("div");
  toolbar.setAttribute("data-pdf-toolbar", "true");

  const zoomGroup = document.createElement("div");
  zoomGroup.setAttribute("data-pdf-group", "zoom");
  const zoomOutBtn = makeButton("Diminuir zoom", "−", ["data-pdf-control", "zoom-out"]);
  const zoomStatus = document.createElement("span");
  zoomStatus.setAttribute("data-pdf-zoom-label", "true");
  zoomStatus.textContent = "Largura";
  const zoomInBtn = makeButton("Aumentar zoom", "+", ["data-pdf-control", "zoom-in"]);
  const fitBtn = makeButton("Ajustar à largura", "Ajustar", ["data-pdf-control", "fit"]);
  fitBtn.setAttribute("aria-pressed", "true");
  zoomGroup.append(zoomOutBtn, zoomStatus, zoomInBtn, fitBtn);

  const toneGroup = document.createElement("div");
  toneGroup.setAttribute("data-pdf-group", "tone");
  toneGroup.setAttribute("role", "group");
  toneGroup.setAttribute("aria-label", "Modo de conforto de leitura");
  const toneButtons: Record<PdfReadingTone, HTMLButtonElement> = {
    normal: makeButton("Modo claro original", "Original", ["data-pdf-tone-btn", "normal"]),
    sepia: makeButton("Modo sépia suave", "Sépia", ["data-pdf-tone-btn", "sepia"]),
    dark: makeButton("Modo noturno", "Noturno", ["data-pdf-tone-btn", "dark"]),
  };
  toneGroup.append(toneButtons.normal, toneButtons.sepia, toneButtons.dark);

  const linkGroup = document.createElement("div");
  linkGroup.setAttribute("data-pdf-group", "links");
  const downloadLink = makeActionLink(url, "Baixar PDF", "Baixar", fileName);
  const openTabLink = makeActionLink(url, "Abrir em nova aba", "Abrir ↗");
  linkGroup.append(downloadLink, openTabLink);

  toolbar.append(zoomGroup, toneGroup, linkGroup);

  // Palco rolável central com o canvas da página.
  const stage = document.createElement("div");
  stage.setAttribute("data-pdf-stage", "true");
  stage.setAttribute("data-pdf-tone", tone);

  const statusBanner = document.createElement("p");
  statusBanner.setAttribute("data-pdf-status", "true");
  statusBanner.textContent = "Carregando documento…";

  const frame = document.createElement("div");
  frame.setAttribute("data-pdf-page-frame", "true");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("data-pdf-canvas", "true");
  frame.append(canvas);
  frame.hidden = true;

  const fallback = document.createElement("div");
  fallback.setAttribute("data-pdf-fallback", "true");
  fallback.hidden = true;
  const fallbackText = document.createElement("p");
  fallbackText.textContent =
    "Não foi possível renderizar a prévia aqui. Você ainda pode ler ou baixar o PDF diretamente.";
  const fallbackActions = document.createElement("div");
  fallbackActions.setAttribute("data-pdf-fallback-actions", "true");
  fallbackActions.append(
    makeActionLink(url, "Abrir PDF em nova aba", "Abrir PDF em nova aba"),
    makeActionLink(url, "Baixar arquivo PDF", "Baixar PDF", fileName),
  );
  fallback.append(fallbackText, fallbackActions);

  stage.append(statusBanner, frame, fallback);

  // Barra inferior: paginação ergonômica para polegar (mobile) e teclado (desktop).
  const footer = document.createElement("div");
  footer.setAttribute("data-pdf-footer", "true");

  const prevBtn = makeButton("Página anterior", "‹ Anterior", ["data-pdf-control", "prev"]);
  const pageInfo = document.createElement("div");
  pageInfo.setAttribute("data-pdf-page-info", "true");
  pageInfo.setAttribute("aria-live", "polite");

  const pageInput = document.createElement("input");
  pageInput.type = "number";
  pageInput.min = "1";
  pageInput.value = "1";
  pageInput.setAttribute("aria-label", "Ir para página");
  pageInput.setAttribute("data-pdf-page-input", "true");

  const pageTotal = document.createElement("span");
  pageTotal.setAttribute("data-pdf-page-total", "true");
  pageTotal.textContent = "de —";
  pageInfo.append(pageInput, pageTotal);

  const nextBtn = makeButton("Próxima página", "Próxima ›", ["data-pdf-control", "next"]);
  footer.append(prevBtn, pageInfo, nextBtn);

  root.append(toolbar, stage, footer);
  host.append(root);

  const syncToneButtons = () => {
    (Object.keys(toneButtons) as PdfReadingTone[]).forEach((key) => {
      toneButtons[key].setAttribute("aria-pressed", String(tone === key));
    });
    stage.setAttribute("data-pdf-tone", tone);
  };

  const syncControls = () => {
    prevBtn.disabled = totalPages === 0 || currentPage <= 1;
    nextBtn.disabled = totalPages === 0 || currentPage >= totalPages;
    pageInput.disabled = totalPages === 0;
    pageInput.max = String(Math.max(1, totalPages));
    pageInput.value = String(currentPage);
    pageTotal.textContent = totalPages > 0 ? `de ${totalPages}` : "de —";
    fitBtn.setAttribute("aria-pressed", String(fitWidth));
    zoomStatus.textContent = fitWidth ? "Largura" : `${Math.round(manualScale * 100)}%`;
    zoomOutBtn.disabled = !fitWidth && manualScale <= MIN_ZOOM + 0.01;
    zoomInBtn.disabled = !fitWidth && manualScale >= MAX_ZOOM - 0.01;
    syncToneButtons();
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || disposed) return;
    if (activeRenderCancel) {
      activeRenderCancel();
      activeRenderCancel = null;
    }

    const page = await pdfDoc.getPage(pageNum);
    if (disposed) return;

    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(260, stage.clientWidth - 24);
    const computedScale = fitWidth
      ? Math.max(0.45, Math.min(2.4, availableWidth / Math.max(1, baseViewport.width)))
      : manualScale;

    if (fitWidth) {
      manualScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, computedScale));
    }

    const viewport = page.getViewport({ scale: computedScale });
    const dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));

    canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
    canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const task = page.render({ canvasContext: ctx, viewport });
    activeRenderCancel = () => task.cancel?.();
    await task.promise;
    if (disposed) return;

    activeRenderCancel = null;
    statusBanner.hidden = true;
    frame.hidden = false;
    stage.scrollTop = 0;
  };

  const goToPage = (next: number) => {
    if (totalPages <= 0) return;
    const clamped = Math.max(1, Math.min(totalPages, next));
    if (clamped === currentPage && !frame.hidden) return;
    currentPage = clamped;
    syncControls();
    void renderPage(currentPage);
  };

  prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
  nextBtn.addEventListener("click", () => goToPage(currentPage + 1));

  pageInput.addEventListener("change", () => {
    const parsed = Number.parseInt(pageInput.value, 10);
    if (Number.isFinite(parsed)) {
      goToPage(parsed);
    } else {
      pageInput.value = String(currentPage);
    }
  });

  zoomOutBtn.addEventListener("click", () => {
    fitWidth = false;
    manualScale = Math.max(MIN_ZOOM, Number((manualScale - ZOOM_STEP).toFixed(2)));
    syncControls();
    void renderPage(currentPage);
  });

  zoomInBtn.addEventListener("click", () => {
    fitWidth = false;
    manualScale = Math.min(MAX_ZOOM, Number((manualScale + ZOOM_STEP).toFixed(2)));
    syncControls();
    void renderPage(currentPage);
  });

  fitBtn.addEventListener("click", () => {
    fitWidth = true;
    syncControls();
    void renderPage(currentPage);
  });

  (Object.keys(toneButtons) as PdfReadingTone[]).forEach((key) => {
    toneButtons[key].addEventListener("click", () => {
      tone = key;
      syncToneButtons();
    });
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goToPage(currentPage - 1);
    } else if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      goToPage(currentPage + 1);
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomInBtn.click();
    } else if (event.key === "-") {
      event.preventDefault();
      zoomOutBtn.click();
    }
  };
  root.addEventListener("keydown", onKeyDown);

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (fitWidth && pdfDoc && !disposed) {
        void renderPage(currentPage);
      }
    });
    resizeObserver.observe(stage);
  }

  syncControls();

  void loadPdf(url)
    .then((doc) => {
      if (disposed) {
        void doc.destroy?.();
        return;
      }
      pdfDoc = doc;
      totalPages = Math.max(1, doc.numPages);
      currentPage = 1;
      syncControls();
      return renderPage(1);
    })
    .catch(() => {
      if (disposed) return;
      statusBanner.hidden = true;
      frame.hidden = true;
      fallback.hidden = false;
    });

  return () => {
    disposed = true;
    activeRenderCancel?.();
    resizeObserver?.disconnect();
    root.removeEventListener("keydown", onKeyDown);
    void pdfDoc?.destroy?.();
    root.remove();
  };
}
