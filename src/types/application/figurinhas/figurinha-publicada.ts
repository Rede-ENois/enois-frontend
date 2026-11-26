import type { FigurinhaAutor } from "./figurinha-autor";
import type { FigurinhaComunidade } from "./figurinha-comunidade";

export type FigurinhaPublicada = {
  figurinha: FigurinhaComunidade;
  autores: Record<string, FigurinhaAutor>;
};
