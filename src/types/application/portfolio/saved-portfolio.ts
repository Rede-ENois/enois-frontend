import type { MyPortfolio } from "./my-portfolio";
import type { PublishedPortfolio } from "./published-portfolio";

/** O que uma gravação do portfólio devolve: o rascunho atualizado, ou o retrato publicado. */
export type SavedPortfolio =
  | { kind: "portfolio"; portfolio: MyPortfolio }
  | { kind: "published"; published: PublishedPortfolio };
