/** Uma coleção do dono na ótica de um post: `tem` diz se o post já está guardado nela. */
export type ColecaoDoPost = {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  tem: boolean;
  createdAt: string;
};
