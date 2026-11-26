/**
 * `GET /portfolio`: uma vitrine no ar, resumida para o Explorar. O título é a primeira manchete da
 * página publicada (null quando ela não tem texto); nome e avatar vêm do perfil de quem publicou.
 */
export type PortfolioShowcaseSummary = {
  username: string;
  name: string;
  avatarUrl: string | null;
  version: number;
  publishedAt: string;
  title: string | null;
};
