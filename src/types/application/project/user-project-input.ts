/** Corpo de criação/edição de um card de projeto (o id vai na URL). */
export type UserProjectInput = {
  title: string;
  description?: string | null;
  banner: string | null;
  icon: string | null;
  stack: string[];
  repoUrl: string | null;
  status: string | null;
  diary: { date: string; text: string }[];
  html: string | null;
};
