import type { AgeState } from "@/types/application/profile/age-state";
import type { Certification } from "@/types/application/profile/certification";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { Education } from "@/types/application/profile/education";
import type { EducationRequest } from "@/types/application/profile/education-request";
import type { Experience } from "@/types/application/profile/experience";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Profile } from "@/types/application/profile/profile";
import type { ProfileAppearance } from "@/types/application/profile/profile-appearance";
import type { ProfileNetworkUser } from "@/types/application/profile/profile-network-user";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";

import { api } from "../api-client";

export const profileApi = {
  /** Liga/desliga a secao de ranking no perfil (preferencia da conta; padrao: mostrar). */
  setRanking: (show: boolean) => api.put<{ id: string; status: string }>("/me/ranking", { show }),

  me: () => api.get<Profile>("/me"),

  /** Estado de idade (ECA Digital): o que decide se o app pede a data de nascimento. */
  ageState: () => api.get<AgeState>("/me/age-state"),

  /** Declara (ou corrige) a data de nascimento. Formato ISO: aaaa-mm-dd. */
  declareBirthDate: (birthDate: string) => api.post<AgeState>("/me/birth-date", { birthDate }),

  get: (username: string) => api.get<Profile>(`/users/${username}`),

  network: (username: string, kind: "connections" | "followers") =>
    api.get<ProfileNetworkUser[]>(`/users/${encodeURIComponent(username)}/${kind}`),

  getById: (id: string) => api.get<Profile>(`/users/by-id/${id}`),

  update: (data: UpdateProfileRequest) => api.patch<Profile>("/me/profile", data),

  /**
   * Aparência da vitrine: um visual para o perfil social e outro para o profissional.
   * Não confundir com o tema da conta (`/me/theme`), que é a preferência de quem olha.
   */
  setProfileAppearance: (appearance: ProfileAppearance) =>
    api.put<ProfileAppearance>("/me/profile-appearance", appearance),

  experiences: {
    list: () => api.get<Experience[]>("/me/experiences"),
    byUser: (username: string) => api.get<Experience[]>(`/users/${username}/experiences`),
    create: (data: ExperienceRequest) => api.post<Experience>("/me/experiences", data),
    update: (id: string, data: ExperienceRequest) =>
      api.put<Experience>(`/me/experiences/${id}`, data),
    delete: (id: string) => api.delete<void>(`/me/experiences/${id}`),
  },

  education: {
    list: () => api.get<Education[]>("/me/education"),
    create: (data: EducationRequest) => api.post<Education>("/me/education", data),
    update: (id: string, data: EducationRequest) => api.put<Education>(`/me/education/${id}`, data),
    delete: (id: string) => api.delete<void>(`/me/education/${id}`),
  },

  certifications: {
    list: () => api.get<Certification[]>("/me/certifications"),
    create: (data: CertificationRequest) => api.post<Certification>("/me/certifications", data),
    update: (id: string, data: CertificationRequest) =>
      api.put<Certification>(`/me/certifications/${id}`, data),
    delete: (id: string) => api.delete<void>(`/me/certifications/${id}`),
  },
};
