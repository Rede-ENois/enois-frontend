import type { FigurinhaOrigem } from "./figurinha-origem";

/**
 * Uma figurinha da comunidade como o backend a serve. `codigo` já vem entre dois-pontos
 * (`:nomedacomunidade:`), porque é exatamente isso que entra no texto.
 */
export type FigurinhaComunidade = {
  id: string;
  codigo: string;
  origem: FigurinhaOrigem;
  nome: string;
  autorId: string;
  /** Endereço público da imagem (CDN/S3 do site), pronto para desenhar. */
  imagem: string;
  largura: number;
  altura: number;
  ativo: boolean;
  criadoEm: string;
  desativadoEm: string | null;
};
