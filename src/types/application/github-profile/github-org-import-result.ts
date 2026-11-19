/** O que a importação de uma organização entregou: a empresa criada ou reaproveitada e os projetos. */
export type GitHubOrgImportResult = {
  slug: string;
  name: string;
  created: number;
};
