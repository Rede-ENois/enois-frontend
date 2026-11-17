import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** A pessoa ligada a um mural: o dono do quadro ou quem colou uma publicação. */
export type MuralAutor = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  avatarFrame: string | null;
  style: AuthorNameStyle | null;
};
