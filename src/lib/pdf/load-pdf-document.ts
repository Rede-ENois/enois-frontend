import type { PdfDocumentLike } from "@/types/pdf/pdf-document-like";

/**
 * Carrega um documento PDF com a build legacy do pdfjs-dist (compatível com mobile e desktop).
 * Quando `file` é informado (prévia local no compositor), lê os bytes direto de `File` para
 * evitar `fetch(blob:...)` bloqueado por `connect-src` na CSP.
 */
export async function loadPdfDocument(url: string, file?: File): Promise<PdfDocumentLike> {
  const [pdfjs, workerMod, data] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    file
      ? file.arrayBuffer().then((buf) => new Uint8Array(buf))
      : fetch(url).then(async (response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return new Uint8Array(await response.arrayBuffer());
        }),
  ]);
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
  }
  const task = pdfjs.getDocument({ data });
  return (await task.promise) as unknown as PdfDocumentLike;
}
