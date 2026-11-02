import type { CorporateImportPreview } from "@/types/application/corporate/corporate-import-preview";
import type { CorporateProfileView } from "@/types/application/corporate/corporate-profile-view";

import { api } from "../api-client";

/** Perfil profissional (o alterego corporativo da conta logada). */
export const corporateApi = {
  me: () => api.get<CorporateProfileView>("/me/business-profile"),

  create: (username: string, name: string) =>
    api.post<CorporateProfileView>("/me/business-profile", { username, name }),

  updateDetails: (data: {
    headline?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    bannerHtml?: string;
    location?: string;
    industry?: string;
    externalLinks?: string;
  }) => api.patch<CorporateProfileView>("/me/business-profile", data),

  rename: (name: string) => api.post<CorporateProfileView>("/me/business-profile/name", { name }),

  /**
   * Troca o nametag: o `@` E o fim da URL pública (`/profissional/{nametag}`). É independente do
   * @ social, então pode ser diferente dele.
   */
  changeUsername: (username: string) =>
    api.post<CorporateProfileView>("/me/business-profile/username", { username }),

  activate: () => api.post<CorporateProfileView>("/me/business-profile/activate", {}),

  deactivate: () => api.post<CorporateProfileView>("/me/business-profile/deactivate", {}),

  /** Prévia do que o perfil social oferece — não grava nada. */
  importPreview: () => api.get<CorporateImportPreview>("/me/business-profile/import-preview"),

  /** Traz do social SÓ os campos escolhidos (consentimento campo a campo). */
  importFromSocial: (fields: string[]) =>
    api.post<CorporateProfileView>("/me/business-profile/import", { fields }),

  byUsername: (username: string) =>
    api.get<CorporateProfileView>(`/corporate/${encodeURIComponent(username)}`),
};
