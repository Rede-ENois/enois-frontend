/** Uma acolhida num desabafo: texto puro, SEM autor — o anonimato vale para a acolhida também. */
export type DesabafosCommentView = {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  /** Quem vê é quem escreveu: a tela mostra o gesto de remover a própria. */
  mine: boolean;
};
