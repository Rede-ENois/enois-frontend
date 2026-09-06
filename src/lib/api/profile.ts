import { api } from "../api-client";

export interface Profile {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  email: string;
  company: string | null;
  location: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  skills: string[];
  goals: string[];
  availability: string | null;
  portfolio: string | null;
  externalLinks: string[];
  openToWork: boolean;
  isMentor: boolean;
  connectionsCount?: number;
  followersCount?: number;
  reputation?: number;
}

export interface UpdateProfileInput {
  username?: string;
  name?: string;
  headline?: string | null;
  company?: string | null;
  location?: string | null;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  skills?: string[];
  goals?: string[];
  availability?: string | null;
  portfolio?: string | null;
  externalLinks?: string[];
  openToWork?: boolean;
  isMentor?: boolean;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  currentlyHere: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface ExperienceInput {
  title: string;
  company: string;
  location?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  description: string | null;
  currentlyHere: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface EducationInput {
  school: string;
  degree: string;
  field: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  description: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  credentialUrl: string | null;
}

export interface CertificationInput {
  name: string;
  issuer: string;
  description?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  credentialUrl?: string | null;
}

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
