import type { PdfPageLike } from "./pdf-page-like";

export type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
  destroy?: () => Promise<void> | void;
};
