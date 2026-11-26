import type { SavedPortfolio } from "./saved-portfolio";

/**
 * Uma gravação do portfólio com o que a tela diz ao terminar: `kind` mantém o cache coerente
 * (publicar não reescreve o rascunho) e o par `success`/`failure` é o texto de quem pediu.
 */
export type PortfolioRequest = (() => Promise<SavedPortfolio>) & {
  kind: "draft" | "block" | "remove" | "order" | "publish";
  success: string;
  failure: string;
};
