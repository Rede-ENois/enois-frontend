/** Uma reação numa confissão: texto puro, SEM autor — o anonimato vale para comentário também. */
export type ConfissaoCommentView = {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  /** Quem vê é quem escreveu: a tela mostra o gesto de remover a própria. */
  mine: boolean;
};
