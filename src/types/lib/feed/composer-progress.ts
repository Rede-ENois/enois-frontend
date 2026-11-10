/**
 * O que a pessoa já começou a escrever no compositor do feed. O compositor só descansa em uma
 * linha (o launcher) quando nada disso é verdade.
 */
export type ComposerProgress = {
  /** O compositor foi aberto por um atalho (`?compor=...`) ou por um toque no launcher. */
  open: boolean;
  /** Texto digitado no campo de cima. */
  draft: string;
  /** Quantos arquivos foram anexados. */
  mediaCount: number;
  /** Tipo escolhido no seletor. */
  postType: string;
};
