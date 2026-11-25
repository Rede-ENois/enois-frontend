import type { FigurinhaDoIndice } from "./figurinha-do-indice";

/** O que aparece no menu do `:`: o índice sem o nome; aqui o nome vem do outro catálogo. */
export type FigurinhaSugerida = FigurinhaDoIndice & { nome: string };
