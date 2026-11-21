import type { PdfDocumentLike } from "./pdf-document-like";

export type PdfLoader = (url: string, file?: File) => Promise<PdfDocumentLike>;
