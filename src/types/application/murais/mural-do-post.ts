/** Um mural do dono na ótica de um post: `tem` diz se o post já está colado no quadro. */
export type MuralDoPost = {
  id: string;
  title: string;
  description: string | null;
  contributions: number;
  tem: boolean;
  createdAt: string;
};
