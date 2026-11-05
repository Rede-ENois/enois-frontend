import type { LinkPreview } from "@/types/application/link-preview/link-preview";

import { resolveCdnUrl } from "@/lib/api/media";

const SAFE_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * A imagem do cartão, ou `null` para não desenhar nada.
 *
 * O endereço vem do `og:image` de um site de fora — dado de terceiro. O backend já o resolveu
 * contra a página e recusou o que não é http(s); aqui a mesma porta é fechada de novo porque a URL
 * atravessa o resolver de CDN do app: a casa usa caminho relativo, e nada além de http(s) chega ao
 * `src` (data:, javascript: e afins viram `null`, não uma imagem).
 */
export function safeImageUrl(raw: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  // A checagem vem ANTES do resolver de CDN: ele prefixa o CDN em qualquer coisa que não comece
  // com http(s), então `javascript:...` sairia de lá como uma URL https válida apontando para o
  // CDN. Só caminho relativo e http(s) chegam ao resolver.
  if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) return null;
  const resolved = resolveCdnUrl(value);
  if (!resolved) return null;
  try {
    return SAFE_IMAGE_PROTOCOLS.has(new URL(resolved).protocol) ? resolved : null;
  } catch {
    return null;
  }
}

/** O host do endereço, para o cartão simples e para o canto do cartão com miniatura. */
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * O rótulo do canto do cartão: o nome do site quando ele declara, senão o tipo da página interna
 * ("Perfil", "Vaga"...) e, por último, o host.
 */
export function labelOf(preview: LinkPreview | null, url: string): string {
  const site = preview?.siteName?.trim();
  if (site) return site;
  return domainOf(url);
}

/**
 * Para onde o cartão leva.
 *
 * Página do próprio Énóis abre DENTRO do app (o caminho interno, para o router navegar); site de
 * fora abre em outra aba, como o link sempre abriu. Um endereço interno sem caminho reconhecível
 * não tem para onde ir dentro do app: cai fora também, em vez de um botão sem destino.
 */
export function targetOf(
  url: string,
  preview: LinkPreview | null,
  internalPath: string | null,
): { href: string; outside: boolean } {
  if (preview?.kind === "INTERNAL" && internalPath) return { href: internalPath, outside: false };
  return { href: url, outside: true };
}
