import type { PdfDocumentLike } from "@/types/pdf/pdf-document-like";
import type { PdfLayoutMode } from "@/types/pdf/pdf-layout-mode";
import type { PdfLoader } from "@/types/pdf/pdf-loader";
import type { PdfPageLike } from "@/types/pdf/pdf-page-like";
import type { PdfReadingTone } from "@/types/pdf/pdf-reading-tone";
import type { PdfZoomMode } from "@/types/pdf/pdf-zoom-mode";

import { loadPdfDocument } from "./load-pdf-document";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 0.2;

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
  options: { url: string; fileName: string; file?: File; loadPdf?: PdfLoader },
): () => void {
  const { url, fileName, file, loadPdf = loadPdfDocument } = options;

  let disposed = false;
  let pdfDoc: PdfDocumentLike | null = null;
  let currentPage = 1;
  let totalPages = 0;
  let zoomMode: PdfZoomMode = "fit";
  let manualScale = 1;
  let tone: PdfReadingTone = "normal";
  let layoutMode: PdfLayoutMode = "paged";
  let renderGeneration = 0;
  let activeRenderCancel: (() => void) | null = null;
  let continuousFrames: HTMLElement[] = [];

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
  const comfortBtn = makeButton("Modo texto confortável para celular", "Leitura", [
    "data-pdf-control",
    "comfort",
  ]);
  fitBtn.setAttribute("aria-pressed", "true");
  comfortBtn.setAttribute("aria-pressed", "false");
  zoomGroup.append(zoomOutBtn, zoomStatus, zoomInBtn, fitBtn, comfortBtn);

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

  const layoutGroup = document.createElement("div");
  layoutGroup.setAttribute("data-pdf-group", "layout");
  layoutGroup.setAttribute("role", "group");
  layoutGroup.setAttribute("aria-label", "Modo de exibição das páginas");
  const layoutButtons: Record<PdfLayoutMode, HTMLButtonElement> = {
    paged: makeButton("Leitura paginada", "Paginado", ["data-pdf-layout-btn", "paged"]),
    continuous: makeButton("Leitura contínua sem paginação", "Contínuo", [
      "data-pdf-layout-btn",
      "continuous",
    ]),
  };
  layoutGroup.append(layoutButtons.paged, layoutButtons.continuous);

  const linkGroup = document.createElement("div");
  linkGroup.setAttribute("data-pdf-group", "links");
  const downloadLink = makeActionLink(url, "Baixar PDF", "Baixar", fileName);
  const openTabLink = makeActionLink(url, "Abrir em nova aba", "Abrir ↗");
  linkGroup.append(downloadLink, openTabLink);

  toolbar.append(zoomGroup, toneGroup, layoutGroup, linkGroup);

  // Palco rolável central com o canvas da página (ou lista contínua de páginas).
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

  const continuousList = document.createElement("div");
  continuousList.setAttribute("data-pdf-continuous-list", "true");
  continuousList.hidden = true;

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

  stage.append(statusBanner, frame, continuousList, fallback);

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

  const syncLayoutButtons = () => {
    (Object.keys(layoutButtons) as PdfLayoutMode[]).forEach((key) => {
      layoutButtons[key].setAttribute("aria-pressed", String(layoutMode === key));
    });
  };

  const syncControls = () => {
    prevBtn.disabled = totalPages === 0 || currentPage <= 1;
    nextBtn.disabled = totalPages === 0 || currentPage >= totalPages;
    pageInput.disabled = totalPages === 0;
    pageInput.max = String(Math.max(1, totalPages));
    pageInput.value = String(currentPage);
    pageTotal.textContent = totalPages > 0 ? `de ${totalPages}` : "de —";
    fitBtn.setAttribute("aria-pressed", String(zoomMode === "fit"));
    comfortBtn.setAttribute("aria-pressed", String(zoomMode === "comfort"));
    if (zoomMode === "fit") {
      zoomStatus.textContent = "Largura";
    } else if (zoomMode === "comfort") {
      zoomStatus.textContent = "Leitura";
    } else {
      zoomStatus.textContent = `${Math.round(manualScale * 100)}%`;
    }
    zoomOutBtn.disabled = zoomMode === "manual" && manualScale <= MIN_ZOOM + 0.01;
    zoomInBtn.disabled = zoomMode === "manual" && manualScale >= MAX_ZOOM - 0.01;
    syncToneButtons();
    syncLayoutButtons();
  };

  const renderCanvasPage = async (page: PdfPageLike, targetCanvas: HTMLCanvasElement) => {
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(260, stage.clientWidth - 16);
    const fitScale = availableWidth / Math.max(1, baseViewport.width);

    let computedScale = manualScale;
    if (zoomMode === "fit") {
      computedScale = Math.max(0.45, Math.min(2.4, fitScale));
      manualScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, computedScale));
    } else if (zoomMode === "comfort") {
      const isMobileStage = availableWidth < 600;
      const comfortTarget = isMobileStage
        ? Math.max(fitScale * 1.38, 0.95)
        : Math.max(fitScale * 1.15, 1.1);
      computedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, comfortTarget));
      manualScale = computedScale;
    }

    const viewport = page.getViewport({ scale: computedScale });
    const dpr = Math.min(2.5, Math.max(1.5, window.devicePixelRatio || 1));

    targetCanvas.width = Math.max(1, Math.floor(viewport.width * dpr));
    targetCanvas.height = Math.max(1, Math.floor(viewport.height * dpr));
    targetCanvas.style.width = `${Math.floor(viewport.width)}px`;
    targetCanvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const task = page.render({ canvas: targetCanvas, canvasContext: ctx, viewport });
    activeRenderCancel = () => task.cancel?.();
    try {
      await task.promise;
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === "RenderingCancelledException") {
        return;
      }
      throw error;
    } finally {
      activeRenderCancel = null;
    }
  };

  const renderPaged = async (pageNum: number, generation: number) => {
    if (!pdfDoc || disposed) return;
    continuousList.hidden = true;
    continuousList.replaceChildren();
    continuousFrames = [];

    const page = await pdfDoc.getPage(pageNum);
    if (disposed || generation !== renderGeneration) return;

    await renderCanvasPage(page, canvas);
    if (disposed || generation !== renderGeneration) return;

    statusBanner.hidden = true;
    frame.hidden = false;
    stage.scrollTop = 0;
  };

  const renderContinuous = async (generation: number) => {
    if (!pdfDoc || disposed) return;
    frame.hidden = true;
    continuousList.replaceChildren();
    continuousFrames = [];

    const items: Array<{ pageNum: number; pageCanvas: HTMLCanvasElement }> = [];
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageFrame = document.createElement("div");
      pageFrame.setAttribute("data-pdf-page-frame", "true");
      pageFrame.setAttribute("data-pdf-page-number", String(pageNum));
      const pageCanvas = document.createElement("canvas");
      pageCanvas.setAttribute("data-pdf-canvas", "true");
      pageFrame.append(pageCanvas);
      continuousList.append(pageFrame);
      continuousFrames.push(pageFrame);
      items.push({ pageNum, pageCanvas });
    }
    statusBanner.hidden = true;
    continuousList.hidden = false;

    for (const item of items) {
      if (disposed || generation !== renderGeneration) return;
      const page = await pdfDoc.getPage(item.pageNum);
      if (disposed || generation !== renderGeneration) return;
      await renderCanvasPage(page, item.pageCanvas);
    }
  };

  const renderCurrentView = () => {
    if (!pdfDoc || disposed) return;
    if (activeRenderCancel) {
      activeRenderCancel();
      activeRenderCancel = null;
    }
    const generation = ++renderGeneration;
    if (layoutMode === "continuous") {
      return renderContinuous(generation);
    }
    return renderPaged(currentPage, generation);
  };

  const goToPage = (next: number) => {
    if (totalPages <= 0) return;
    const clamped = Math.max(1, Math.min(totalPages, next));
    currentPage = clamped;
    syncControls();
    if (layoutMode === "continuous") {
      continuousFrames[clamped - 1]?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      return;
    }
    void renderCurrentView();
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
    zoomMode = "manual";
    manualScale = Math.max(MIN_ZOOM, Number((manualScale - ZOOM_STEP).toFixed(2)));
    syncControls();
    void renderCurrentView();
  });

  zoomInBtn.addEventListener("click", () => {
    zoomMode = "manual";
    manualScale = Math.min(MAX_ZOOM, Number((manualScale + ZOOM_STEP).toFixed(2)));
    syncControls();
    void renderCurrentView();
  });

  fitBtn.addEventListener("click", () => {
    zoomMode = "fit";
    syncControls();
    void renderCurrentView();
  });

  comfortBtn.addEventListener("click", () => {
    zoomMode = "comfort";
    syncControls();
    void renderCurrentView();
  });

  let lastTapTime = 0;
  stage.addEventListener("pointerup", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button") || target?.closest("a") || target?.closest("input")) {
      return;
    }
    if (event.button !== 0) return;
    const now = Date.now();
    if (now - lastTapTime < 350) {
      zoomMode = zoomMode === "comfort" ? "fit" : "comfort";
      syncControls();
      void renderCurrentView();
      lastTapTime = 0;
    } else {
      lastTapTime = now;
    }
  });

  (Object.keys(toneButtons) as PdfReadingTone[]).forEach((key) => {
    toneButtons[key].addEventListener("click", () => {
      tone = key;
      syncToneButtons();
    });
  });

  (Object.keys(layoutButtons) as PdfLayoutMode[]).forEach((key) => {
    layoutButtons[key].addEventListener("click", () => {
      if (layoutMode === key) return;
      layoutMode = key;
      syncLayoutButtons();
      void renderCurrentView();
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
      if (zoomMode !== "manual" && pdfDoc && !disposed) {
        void renderCurrentView();
      }
    });
    resizeObserver.observe(stage);
  }

  syncControls();

  void loadPdf(url, file)
    .then((doc) => {
      if (disposed) {
        void doc.destroy?.();
        return;
      }
      pdfDoc = doc;
      totalPages = Math.max(1, doc.numPages);
      currentPage = 1;
      syncControls();
      return renderCurrentView();
    })
    .catch((err) => {
      console.warn("[pdf-reader] failed to render PDF preview", err);
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
