import type { AuthorNameStyle } from "@rede-enois/design-system/domain";

/** Quem está no grupo de uma conversa e com qual papel. */
export type GroupParticipantView = {
  userId: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string | null;
  nameStyle: AuthorNameStyle | null;
};
