/** Uma discussão em que a conta participou (o container monta o link da publicação). */
export type WrappedTreta = {
  publicacaoId: string;
  comentarios: number;
  diasDistintos: number;
  duracaoDias: number;
  primeira: string;
  ultima: string;
  trecho: string | null;
};
