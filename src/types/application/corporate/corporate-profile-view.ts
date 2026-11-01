import type { Certification } from "@/types/application/profile/certification";
import type { Education } from "@/types/application/profile/education";
import type { Experience } from "@/types/application/profile/experience";

/**
 * Estado do perfil profissional da conta (GET /me/business-profile) e a página pública
 * (GET /corporate/{username}). Os campos opcionais só vêm na leitura pública: são os valores da
 * conta que a identidade profissional mostra, nunca o @ social.
 */
export type CorporateProfileView = {
  exists: boolean;
  userId?: string;
  username: string;
  name: string;
  headline: string;
  bio: string;
  avatar: string;
  banner: string;
  bannerHtml: string;
  location: string;
  industry: string;
  externalLinks: string;
  status: "DRAFT" | "ACTIVE" | "DISABLED";
  identityVerified?: boolean;
  reputation?: number;
  memberSince?: string;
  skills?: string[];
  experiences?: Experience[];
  educations?: Education[];
  certifications?: Certification[];
};
