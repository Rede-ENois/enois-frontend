import type { MediaAsset } from "@/types/application/media/media-asset";
import type { PortfolioPages } from "@/types/application/portfolio/portfolio-pages";

import { resolveCdnUrl } from "@/lib/api/media";

/** O endereço público do objeto: a chave do bucket no CDN do app (mesma regra da mídia). */
export function serveObject(objectKey: string | null | undefined): string | null {
  if (!objectKey) return null;
  return resolveCdnUrl(objectKey) ?? null;
}

/**
 * As páginas que o backend gravou para os PDFs do portfólio são assets próprios (`paginas/...`) e
 * não vêm referenciadas na publicação. Elas ficam identificadas pelo dono: a análise do portfólio
 * de alguém só precisa olhar as páginas das mídias dessa pessoa, e a página de um PDF mostra a
 * primeira folha como card (o documento inteiro só abre pelo botão).
 */
export function pageLotOf(asset: MediaAsset): string | null {
  if (asset.mimeType !== "application/pdf") return null;
  const match = /paginas\/([^/]+)\/pagina-\d+\.png/.exec(asset.cdnUrl ?? "");
  return match?.[1] ?? null;
}

export function firstPageUrl(pages: PortfolioPages | undefined): string | null {
  if (!pages || pages.keys.length === 0) return null;
  const sorted = [...pages.keys].sort((a, b) => pageNumber(a) - pageNumber(b));
  return serveObject(sorted[0]);
}

function pageNumber(url: string): number {
  const match = /\/pagina-(\d+)\.png$/.exec(url);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}
