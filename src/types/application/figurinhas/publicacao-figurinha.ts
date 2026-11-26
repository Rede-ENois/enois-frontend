import type { FigurinhaComunidade } from "./figurinha-comunidade";

/** O resultado de enviar uma figurinha: ela publicada, ou o código da recusa para a tela explicar. */
export type PublicacaoFigurinha =
  { ok: true; figurinha: FigurinhaComunidade } | { ok: false; erro: string };
