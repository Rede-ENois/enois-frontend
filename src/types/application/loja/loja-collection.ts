import type { LojaLook } from "@/types/application/loja/loja-look";

/** A seasonal collection: month-day sale windows (America/Sao_Paulo) and its ready looks. */
export type LojaCollection = {
  id: string;
  name: string;
  available: boolean;
  windows: { start: string; end: string }[];
  looks: LojaLook[];
};
