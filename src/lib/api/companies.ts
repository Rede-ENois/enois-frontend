import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { CompanyMember } from "@/types/application/companies/company-member";
import type { CompanySummary } from "@/types/application/companies/company-summary";
import type { ProposalView } from "@/types/application/companies/proposal-view";

import { api } from "../api-client";

export const companiesApi = {
  bySlug: (slug: string) => api.get<CompanyDetail>(`/empresa/${slug}`),
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
  members: (companyId: string) =>
    api.get<CompanyMember[]>([`/empresas/${companyId}/members`].join("")),
  addMember: (companyId: string, userId: string, role: CompanyMember["role"]) =>
    api.post<CompanyMember>(`/empresas/${companyId}/members`, { userId, role }),

  publishProject: (
    companyId: string,
    data: {
      title: string;
      problem: string;
      scope?: string;
      deliverables: string;
      acceptanceCriteria: string;
      budget?: string;
      deadline?: string;
    },
  ) => api.post<{ id: string; status: string }>(`/empresas/${companyId}/microprojetos`, data),
  project: (projectId: string) =>
    api.get<{ project: CompanyDetail["projects"][number]; proposals: ProposalView[] }>(
      `/microprojetos/${projectId}`,
    ),
  propose: (projectId: string, message: string) =>
    api.post<{ id: string; status: string }>(`/microprojetos/${projectId}/proposals`, { message }),
  selectProposal: (projectId: string, proposalId: string) =>
    api.post<{ status: string }>(`/microprojetos/${projectId}/proposals/${proposalId}/select`),
  complete: (projectId: string) =>
    api.post<{ status: string }>(`/microprojetos/${projectId}/complete`),
};
