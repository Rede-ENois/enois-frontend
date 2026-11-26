import type { PortfolioExploreEntry } from "@/types/application/portfolio/portfolio-explore-entry";
import type { PublishedPortfolio } from "@/types/application/portfolio/published-portfolio";
import type { Profile } from "@/types/application/profile/profile";
import type { PortfolioExploreCard } from "@rede-enois/design-system/domain";

import { ApiError } from "../api-client";

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&#160;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * A primeira frase legível de uma página HTML, como texto. O HTML do autor é escrito pelo próprio
 * dono e não tem estrutura garantida: tira-se o que não é texto (estilo, script), as tags viram
 * espaço e as entidades comuns viram os caracteres que as usam.
 */
export function headlineOf(html: string | null | undefined, limit = 160): string | null {
  if (!html) return null;
  const text = html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    // Uma passada só: o `&amp;` desfeito antes do `&lt;` viraria uma tag inventada na decodificação.
    .replace(
      /&(nbsp|#160|amp|lt|gt|quot|#39);/gi,
      (entity) => ENTITIES[entity.toLowerCase()] ?? entity,
    )
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

/** O primeiro título da página (h1, ou o primeiro h2), como texto; null quando não há. */
export function titleOf(html: string | null | undefined, limit = 120): string | null {
  if (!html) return null;
  const found =
    /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html) ?? /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(html);
  if (!found) return null;
  const text = headlineOf(found[1], limit);
  return text;
}

/** O atalho público da vitrine de uma pessoa. */
export function portfolioHref(username: string): string {
  return `/portfolio/${encodeURIComponent(username)}`;
}

/** A vitrine publicada no formato do Explorar e do card do feed. */
export function portfolioTeaserOf(
  portfolio: PublishedPortfolio,
  profile: Profile,
): PortfolioExploreCard {
  return {
    username: profile.username,
    name: profile.name,
    avatarUrl: profile.avatar,
    headline: headlineOf(portfolio.html),
    href: portfolioHref(profile.username),
  };
}

/**
 * A leitura da própria vitrine lida como uma visita: uma publicação é a vitrine no ar; um 404 é a
 * vitrine ainda não publicada (o rascunho fica no editor). Qualquer outra falha sobe para a tela.
 */
export async function portfolioEntryOf(
  read: () => Promise<PublishedPortfolio>,
  profile: Profile,
): Promise<PortfolioExploreEntry> {
  try {
    return { kind: "published", card: portfolioTeaserOf(await read(), profile) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { kind: "unpublished", card: null };
    }
    throw error;
  }
}
