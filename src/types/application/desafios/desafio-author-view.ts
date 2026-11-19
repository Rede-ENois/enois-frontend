import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** A pessoa por trás de um desafio ou de uma participação: desafios são NOMINAIS. */
export type DesafioAuthorView = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  avatarFrame: string | null;
  nameStyle: AuthorNameStyle | null;
};
