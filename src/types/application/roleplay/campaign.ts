/** Apresentação de campanha para quem está vendo: dados públicos + o papel do próprio na campanha. */
export type Campaign = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  setting: string | null;
  gameSystem: string;
  systemFamily: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: "ACTIVE" | "ARCHIVED";
  members: number;
  viewerRole: "GAME_MASTER" | "PLAYER" | null;
  joined: boolean;
  createdAt: string;
};
