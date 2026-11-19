import type { GitHubImportProjectsResult } from "@/types/application/github-profile/github-import-projects-result";
import type { GitHubOrgImportResult } from "@/types/application/github-profile/github-org-import-result";
import type { GitHubOrganization } from "@/types/application/github-profile/github-organization";
import type { GitHubReadme } from "@/types/application/github-profile/github-readme";
import type { GitHubRepo } from "@/types/application/github-profile/github-repo";

import { api } from "../api-client";

/** Importação dos dados públicos do GitHub vinculado para o próprio perfil. */
export const githubProfileApi = {
  /** Repositórios públicos do login vinculado. */
  repos: () => api.get<GitHubRepo[]>("/me/github/repos"),

  /** README do perfil convertido para o HTML da bio (prévia, sem salvar). */
  readme: () => api.get<GitHubReadme>("/me/github/readme"),

  /** Importa os repositórios escolhidos como cards de projeto. */
  importProjects: (repos: string[]) =>
    api.post<GitHubImportProjectsResult>("/me/github/import/projects", { repos }),

  /** Organizações do GitHub de quem está logado (só aquelas de que a pessoa é membro). */
  orgs: () => api.get<GitHubOrganization[]>("/me/github/orgs"),

  /** Repositórios públicos de uma organização: o catálogo da importação. */
  orgRepos: (org: string) =>
    api.get<GitHubRepo[]>(`/me/github/orgs/${encodeURIComponent(org)}/repos`),

  /** Importa a organização como empresa e os repos marcados como projetos dela. */
  importOrg: (org: string, repos: string[]) =>
    api.post<GitHubOrgImportResult>(`/me/github/import/orgs/${encodeURIComponent(org)}`, { repos }),

  /** Salva o README do perfil como bio em HTML. */
  importReadme: () => api.post<GitHubReadme>("/me/github/import/readme", {}),
};
