import type { MuralAutor } from "@/types/application/murais/mural-autor";

/** O quadro do mural, como o backend devolve: título, descrição, dono e contagem. */
export type MuralResumo = {
  id: string;
  title: string;
  description: string | null;
  owner: MuralAutor;
  contributions: number;
  createdAt: string;
};
