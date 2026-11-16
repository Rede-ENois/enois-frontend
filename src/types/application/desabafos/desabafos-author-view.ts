import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** A pessoa por trás de um desabafo ou acolhida. */
export type DesabafosAuthorView = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  avatarFrame: string | null;
  style: AuthorNameStyle | null;
};
