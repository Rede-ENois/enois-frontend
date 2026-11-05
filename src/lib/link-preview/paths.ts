import { clientOrigin } from "@/lib/api/client-origin";

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * O endereço absoluto e seguro de um link do post.
 *
 * O DS o entrega como foi escrito. O backend só reconhece uma página interna por origem: `/perfil/x`
 * relativo chega como caminho (e é interno), mas `enois.ia.br/perfil/x` digitado sem esquema vira
 * endereço de site externo e a miniatura vem de fora da casa. Aqui ele ganha a origem do site — e
 * com `www.` ou sem é o mesmo host que `clientOrigin()`.
 *
 * Só http(s) sai daqui: qualquer outro esquema (`javascript:`, `data:`...) é `null`, e o cartão
 * não é desenhado. É o mesmo portão do `safeHref` do DS, aplicado no endereço já completo.
 */
export function absoluteLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : trimmed.startsWith("//")
      ? `https:${trimmed}`
      : `${clientOrigin().replace(/\/$/, "")}/${trimmed.replace(/^\/+/, "")}`;
  try {
    const page = new URL(candidate);
    return SAFE_PROTOCOLS.has(page.protocol) ? page.toString() : null;
  } catch {
    return null;
  }
}

/** Caminho interno (com busca) quando o link aponta para o próprio app; `null` para site de fora. */
export function internalPathOf(url: string): string | null {
  let page: URL;
  try {
    page = new URL(url);
  } catch {
    return null;
  }
  if (!SAFE_PROTOCOLS.has(page.protocol)) return null;
  const own = ownHost();
  const host = page.hostname.toLowerCase();
  if (!own || (host !== own && host !== `www.${own}` && `www.${host}` !== own)) return null;
  return `${page.pathname}${page.search}`;
}

function ownHost(): string | null {
  try {
    return new URL(clientOrigin()).hostname.toLowerCase();
  } catch {
    return null;
  }
}
