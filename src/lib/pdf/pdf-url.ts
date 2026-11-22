/** Detecta se uma URL aponta para um documento PDF pelo caminho (ignorando query/hash). */
export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, "https://app.invalid");
    return parsed.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.split(/[?#]/)[0].toLowerCase().endsWith(".pdf");
  }
}

/** Detecta se um item de mídia anexada é um PDF pelo MIME ou pela URL. */
export function isPdfMedia(media: { mimeType?: string | null; cdnUrl?: string | null }): boolean {
  if (media.mimeType?.toLowerCase().split(";")[0].trim() === "application/pdf") {
    return true;
  }
  return isPdfUrl(media.cdnUrl);
}

/** Extrai um nome legível de arquivo PDF a partir da URL. */
export function pdfFileNameOf(url: string, fallback = "Documento PDF"): string {
  try {
    const parsed = new URL(url, "https://app.invalid");
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    if (!last || last.toLowerCase() === "file.pdf") return fallback;
    return decodeURIComponent(last);
  } catch {
    return fallback;
  }
}
