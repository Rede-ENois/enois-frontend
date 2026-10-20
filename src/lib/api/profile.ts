import type { Certification } from "@/types/application/profile/certification";
import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { Education } from "@/types/application/profile/education";
import type { EducationRequest } from "@/types/application/profile/education-request";
import type { Experience } from "@/types/application/profile/experience";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Profile } from "@/types/application/profile/profile";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";

import { api } from "../api-client";

export const profileApi = {
  /** Liga/desliga a secao de ranking no perfil (preferencia da conta; padrao: mostrar). */
  setRanking: (show: boolean) => api.put<{ id: string; status: string }>("/me/ranking", { show }),

  me: () => api.get<Profile>("/me"),

  get: (username: string) => api.get<Profile>(`/users/${username}`),

  getById: (id: string) => api.get<Profile>(`/users/by-id/${id}`),

  update: (data: UpdateProfileRequest) => api.patch<Profile>("/me/profile", data),

  experiences: {
    list: () => api.get<Experience[]>("/me/experiences"),
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
