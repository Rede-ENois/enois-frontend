import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** A pessoa por trás de uma foto ou contribuição da Colagem. */
export type ColagemAuthorView = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  avatarFrame: string | null;
  style: AuthorNameStyle | null;
};
