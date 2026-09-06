import type { Certification, CertificationInput } from "@/types/application/profile/certification";
import type { Education, EducationInput } from "@/types/application/profile/education";
import type { Experience, ExperienceInput } from "@/types/application/profile/experience";
import type { Profile } from "@/types/application/profile/profile";
import type { UpdateProfileInput } from "@/types/application/profile/update-profile-input";

import { api } from "../api-client";

export type { Certification, CertificationInput } from "@/types/application/profile/certification";
export type { Education, EducationInput } from "@/types/application/profile/education";
export type { Experience, ExperienceInput } from "@/types/application/profile/experience";
export type { Profile } from "@/types/application/profile/profile";
export type { UpdateProfileInput } from "@/types/application/profile/update-profile-input";

export const profileApi = {
  getCurrent: () => api.get<Profile>("/me"),

  getByUsername: (username: string) => api.get<Profile>(`/users/${username}`),

  getById: (userId: string) => api.get<Profile>(`/users/by-id/${userId}`),

  updateCurrent: (input: UpdateProfileInput) => api.patch<Profile>("/me/profile", input),

  experiences: {
    list: () => api.get<Experience[]>("/me/experiences"),
    create: (input: ExperienceInput) => api.post<Experience>("/me/experiences", input),
    update: (experienceId: string, input: ExperienceInput) =>
      api.put<Experience>(`/me/experiences/${experienceId}`, input),
    remove: (experienceId: string) => api.delete<void>(`/me/experiences/${experienceId}`),
  },

  education: {
    list: () => api.get<Education[]>("/me/education"),
    create: (input: EducationInput) => api.post<Education>("/me/education", input),
    update: (educationId: string, input: EducationInput) =>
      api.put<Education>(`/me/education/${educationId}`, input),
    remove: (educationId: string) => api.delete<void>(`/me/education/${educationId}`),
  },

  certifications: {
    list: () => api.get<Certification[]>("/me/certifications"),
    create: (input: CertificationInput) => api.post<Certification>("/me/certifications", input),
    update: (certificationId: string, input: CertificationInput) =>
      api.put<Certification>(`/me/certifications/${certificationId}`, input),
    remove: (certificationId: string) => api.delete<void>(`/me/certifications/${certificationId}`),
  },
};
