/** Uma organização do GitHub de quem está logado: a lista de onde se escolhe o que importar. */
export type GitHubOrganization = {
  login: string;
  name: string | null;
  description: string | null;
  htmlUrl: string;
};
