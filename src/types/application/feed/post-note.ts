import type { AuthorContributorTag } from "@/types/application/profile/author-contributor-tag";
import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** Nota de rodapé aprovada pela moderação, exibida como verificação da comunidade. */
export type PostNote = {
  id: string;
  body: string;
  createdAt: string;
  authorUsername: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  authorBadges: string[];
  authorStyle?: AuthorNameStyle | null;
  authorContributor?: AuthorContributorTag | null;
  /** Tag "Aniversariante" quando a pessoa faz aniversário hoje; ausente = não faz. */
  authorBirthdayToday?: boolean;
};
