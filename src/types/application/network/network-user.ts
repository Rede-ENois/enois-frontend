import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type NetworkUser = {
  id: string;
  username: string;
  name: string;
  headline: string;
  avatar: string | null;
  avatarFrame?: string | null;
  /** Personalização do nome (tema/fonte/cor); ausente = padrão. */
  nameStyle?: AuthorNameStyle | null;
  connections: number;
  followers: number;
  connected: boolean;
  /** Only on suggestions: connections the viewer and this person share. */
  mutualConnections?: number | null;
};
