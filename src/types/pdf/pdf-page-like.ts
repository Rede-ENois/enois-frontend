import type { PdfTextItemLike } from "./pdf-text-item-like";

export type PdfPageLike = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvas?: HTMLCanvasElement | null;
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void>; cancel?: () => void };
  getTextContent?: () => Promise<{ items: PdfTextItemLike[] }>;
};
