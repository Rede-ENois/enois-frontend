import type { PdfDocumentLike } from "./pdf-document-like";

export type PdfLoader = (url: string) => Promise<PdfDocumentLike>;
