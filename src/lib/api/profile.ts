import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { Certification } from "@/types/application/profile/certification";
import type { EducationRequest } from "@/types/application/profile/education-request";
import type { Education } from "@/types/application/profile/education";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Experience } from "@/types/application/profile/experience";
import type { Profile } from "@/types/application/profile/profile";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";

import { apiRequest } from "../api-request";

export const profileApi = {
  me: () => apiRequest<Profile>("GET", "/me"),
  get: (username: string) => apiRequest<Profile>("GET", `/users/${username}`),
  getById: (id: string) => apiRequest<Profile>("GET", `/users/by-id/${id}`),
  update: (data: UpdateProfileRequest) => apiRequest<Profile>("PATCH", "/me/profile", data, { idempotent: true }),
  experiences: {
    list: () => apiRequest<Experience[]>("GET", "/me/experiences"),
    create: (data: ExperienceRequest) => apiRequest<Experience>("POST", "/me/experiences", data, { idempotent: true }),
    update: (id: string, data: ExperienceRequest) => apiRequest<Experience>("PUT", `/me/experiences/${id}`, data, { idempotent: true }),
    delete: (id: string) => apiRequest<void>("DELETE", `/me/experiences/${id}`, null, { idempotent: true }),
  },
  education: {
    list: () => apiRequest<Education[]>("GET", "/me/education"),
    create: (data: EducationRequest) => apiRequest<Education>("POST", "/me/education", data, { idempotent: true }),
    update: (id: string, data: EducationRequest) => apiRequest<Education>("PUT", `/me/education/${id}`, data, { idempotent: true }),
    delete: (id: string) => apiRequest<void>("DELETE", `/me/education/${id}`, null, { idempotent: true }),
  },
  certifications: {
    list: () => apiRequest<Certification[]>("GET", "/me/certifications"),
    create: (data: CertificationRequest) => apiRequest<Certification>("POST", "/me/certifications", data, { idempotent: true }),
    update: (id: string, data: CertificationRequest) => apiRequest<Certification>("PUT", `/me/certifications/${id}`, data, { idempotent: true }),
    delete: (id: string) => apiRequest<void>("DELETE", `/me/certifications/${id}`, null, { idempotent: true }),
  },
};
