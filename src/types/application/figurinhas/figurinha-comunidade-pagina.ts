import type { FigurinhaAutor } from "./figurinha-autor";
import type { FigurinhaComunidade } from "./figurinha-comunidade";

export type FigurinhaComunidadePagina = {
  items: FigurinhaComunidade[];
  autores: Record<string, FigurinhaAutor>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Passo 1 do envio: para onde escrever os bytes da imagem. */
