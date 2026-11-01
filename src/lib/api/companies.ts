import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { CompanyDirectoryItem } from "@/types/application/companies/company-directory-item";
import type { CompanyFollowState } from "@/types/application/companies/company-follow-state";
import type { CompanyMember } from "@/types/application/companies/company-member";
import type { CompanySummary } from "@/types/application/companies/company-summary";
import type { MicroProjectFields } from "@/types/application/companies/micro-project-fields";
import type { ProposalView } from "@/types/application/companies/proposal-view";

import { api, buildQuery } from "../api-client";

export const companiesApi = {
  bySlug: (slug: string) => api.get<CompanyDetail>(`/empresa/${slug}`),
  directory: (query?: string, sector?: string | null, limit = 60) =>
    api.get<CompanyDirectoryItem[]>(
      `/empresas/diretorio${buildQuery({ query: query || undefined, sector: sector || undefined, limit })}`,
    ),
  sectors: () => api.get<string[]>("/empresas/setores"),
  follow: (companyId: string) => api.post<CompanyFollowState>(`/empresas/${companyId}/follow`),
  unfollow: (companyId: string) => api.delete<CompanyFollowState>(`/empresas/${companyId}/follow`),
  create: (data: {
    name: string;
    description?: string;
    sector?: string;
    size?: string;
    location?: string;
    website?: string;
  }) => api.post<{ id: string; slug: string; name: string }>("/empresas", data),
  update: (
    companyId: string,
    data: {
      name?: string;
      description?: string;
      sector?: string;
      size?: string;
      location?: string;
      website?: string;
      logo?: string;
      /** "" remove a capa/imagem (o backend trata vazio como remoção). */
      cover?: string;
    },
  ) => api.patch<CompanySummary>(`/empresas/${companyId}`, data),
  mine: () => api.get<CompanySummary[]>("/empresas/mine"),
  members: (companyId: string) => api.get<CompanyMember[]>(`/empresas/${companyId}/members`),
  addMember: (companyId: string, userId: string, role: CompanyMember["role"]) =>
    api.post<CompanyMember>(`/empresas/${companyId}/members`, { userId, role }),

  publishProject: (companyId: string, data: MicroProjectFields) =>
    api.post<{ id: string; status: string }>(`/empresas/${companyId}/microprojetos`, data),
  editProject: (projectId: string, data: MicroProjectFields) =>
    api.put<{ id: string; status: string }>(`/microprojetos/${projectId}`, data),
  removeProject: (projectId: string) =>
    api.delete<{ id: string; status: string }>(`/microprojetos/${projectId}`),
  project: (projectId: string) =>
    api.get<{ project: CompanyDetail["projects"][number]; proposals: ProposalView[] }>(
      `/microprojetos/${projectId}`,
    ),
  propose: (projectId: string, message: string) =>
    api.post<{ id: string; status: string; conversationId: string | null }>(
      `/microprojetos/${projectId}/proposals`,
      { message },
    ),
  selectProposal: (projectId: string, proposalId: string) =>
    api.post<{ status: string }>(`/microprojetos/${projectId}/proposals/${proposalId}/select`),
  /** The review (1 to 5, optional text) goes to the person who delivered. */
  complete: (projectId: string, review: { rating?: number; text?: string } = {}) =>
    api.post<{ status: string }>(`/microprojetos/${projectId}/complete`, review),
};
