import type { TalentBankCandidateDetail } from "@/types/application/talent-banks/talent-bank-candidate-detail";
import type { TalentBankCandidatesPage } from "@/types/application/talent-banks/talent-bank-candidates-page";
import type { TalentBankDetail } from "@/types/application/talent-banks/talent-bank-detail";
import type { TalentBankEnrollment } from "@/types/application/talent-banks/talent-bank-enrollment";
import type { TalentBankEnrollmentInput } from "@/types/application/talent-banks/talent-bank-enrollment-input";
import type { TalentBankEvent } from "@/types/application/talent-banks/talent-bank-event";
import type { TalentBankMyEnrollment } from "@/types/application/talent-banks/talent-bank-my-enrollment";
import type { TalentBankOwned } from "@/types/application/talent-banks/talent-bank-owned";
import type { TalentBankPage } from "@/types/application/talent-banks/talent-bank-page";
import type { TalentBankSaveInput } from "@/types/application/talent-banks/talent-bank-save-input";

import { api, apiUrl, buildQuery, sessionHeaders } from "../api-client";

/**
 * Banco de Talentos: a vitrine pública, a inscrição de quem se candidata e o painel do
 * recrutador. Toda a autorização é conferida no backend — aqui só há transporte.
 */
export const talentBanksApi = {
  discover: (params?: { cursor?: string | null; search?: string; area?: string; limit?: number }) =>
    api.get<TalentBankPage>(
      `/talent-banks${buildQuery({
        cursor: params?.cursor,
        search: params?.search,
        area: params?.area,
        limit: params?.limit,
      })}`,
    ),

  detail: (bankId: string) =>
    api.get<TalentBankDetail>(`/talent-banks/${encodeURIComponent(bankId)}`),

  mine: () => api.get<TalentBankMyEnrollment[]>("/talent-banks/mine/enrollments"),

  requestEnrollment: (bankId: string, data: TalentBankEnrollmentInput) =>
    api.post<TalentBankEnrollment>(`/talent-banks/${encodeURIComponent(bankId)}/enrollments`, data),

  confirmEnrollment: (bankId: string, enrollmentId: string) =>
    api.post<TalentBankEnrollment>(
      `/talent-banks/${encodeURIComponent(bankId)}/enrollments/${encodeURIComponent(enrollmentId)}/confirm`,
    ),

  revokeEnrollment: (bankId: string, enrollmentId: string) =>
    api.delete<TalentBankEnrollment>(
      `/talent-banks/${encodeURIComponent(bankId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
    ),

  eraseEnrollment: (bankId: string, enrollmentId: string) =>
    api.post<TalentBankEnrollment>(
      `/talent-banks/${encodeURIComponent(bankId)}/enrollments/${encodeURIComponent(enrollmentId)}/erase`,
    ),

  myHistory: (enrollmentId: string) =>
    api.get<TalentBankEvent[]>(
      `/talent-banks/enrollments/${encodeURIComponent(enrollmentId)}/history`,
    ),

  owned: () => api.get<TalentBankOwned>("/talent-banks/owned"),

  create: (data: TalentBankSaveInput) => api.post<TalentBankOwned>("/talent-banks", data),

  update: (bankId: string, data: TalentBankSaveInput) =>
    api.patch<TalentBankOwned>(`/talent-banks/${encodeURIComponent(bankId)}`, data),

  setVisibility: (bankId: string, discoverable: boolean) =>
    api.patch<TalentBankOwned>(`/talent-banks/${encodeURIComponent(bankId)}/visibility`, {
      discoverable,
    }),

  candidates: (
    bankId: string,
    params?: {
      cursor?: string | null;
      search?: string;
      state?: string;
      skill?: string;
      minExperiences?: number;
      education?: string;
      limit?: number;
    },
  ) =>
    api.get<TalentBankCandidatesPage>(
      `/talent-banks/${encodeURIComponent(bankId)}/candidates${buildQuery({
        cursor: params?.cursor,
        search: params?.search,
        state: params?.state,
        skill: params?.skill,
        minExperiences: params?.minExperiences,
        education: params?.education,
        limit: params?.limit,
      })}`,
    ),

  candidate: (bankId: string, enrollmentId: string) =>
    api.get<TalentBankCandidateDetail>(
      `/talent-banks/${encodeURIComponent(bankId)}/candidates/${encodeURIComponent(enrollmentId)}`,
    ),

  closeEnrollment: (bankId: string, enrollmentId: string) =>
    api.post<TalentBankEnrollment>(
      `/talent-banks/${encodeURIComponent(bankId)}/candidates/${encodeURIComponent(enrollmentId)}/close`,
    ),

  history: (bankId: string, enrollmentId: string) =>
    api.get<TalentBankEvent[]>(
      `/talent-banks/${encodeURIComponent(bankId)}/candidates/${encodeURIComponent(enrollmentId)}/history`,
    ),

  /**
   * O currículo autorizado: o backend confere a autorização e serve o arquivo. O endereço
   * público do storage nunca chega ao navegador — aqui ele vira um blob da sessão.
   */
  resume: async (bankId: string, enrollmentId: string) => {
    const response = await fetch(
      apiUrl(
        `/talent-banks/${encodeURIComponent(bankId)}/candidates/${encodeURIComponent(enrollmentId)}/resume`,
      ),
      { credentials: "include", headers: sessionHeaders() },
    );

    if (!response.ok) {
      throw new Error("Não foi possível baixar o currículo agora.");
    }

    return response.blob();
  },
};
