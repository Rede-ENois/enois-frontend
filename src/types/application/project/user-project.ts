/** Um card de projeto do perfil: dados estruturados ou HTML próprio (sanitizado no backend). */
export type UserProject = {
  id: string;
  title: string;
  description: string | null;
  /** Imagem de capa do card (URL https), opcional. */
  banner?: string | null;
  /** Ícone do projeto (URL https), opcional. */
  icon?: string | null;
  stack: string[];
  repoUrl: string | null;
  status: string | null;
  diary: { date: string; text: string }[];
  html?: string | null;
};
