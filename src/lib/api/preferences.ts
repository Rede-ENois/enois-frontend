import { texts } from "@/texts";
import type { Personalization } from "@/types/application/preferences/personalization";
import type { BadgeKit } from "@/types/application/profile/badge-kit";
import type { LinkedinImportPreview } from "@/types/application/profile/linkedin-import-preview";
import type { Profile } from "@/types/application/profile/profile";

import { ApiError, api } from "../api-client";
import { clientOriginHeader } from "./client-origin";

/**
 * Preferências sincronizadas com a conta.
 *
 * O tema da coleção é a primeira: escolha individual, persistida no backend para
 * acompanhar a pessoa entre dispositivos. Convidado não tem conta — para ele a
 * preferência é só local, e estes endpoints nunca são chamados.
 */
export const preferencesApi = {
  /** Personalização da experiência (assuntos preferidos/bloqueados e módulos desativados). */
  getPersonalization: () => api.get<Personalization>("/me/preferences"),

  /** Marca o lembrete da madrugada como visto nesta data local (AAAA-MM-DD). */
  dismissNightRest: (night: string) =>
    api.post<Personalization>("/me/preferences/night-rest/dismissed", { night }),

  setPersonalization: (data: Partial<Personalization>) =>
    api.put<Personalization>("/me/preferences", data),

  /** Coleção temática ativa na conta; `null` é o padrão da marca. */
  getTheme: () => api.get<{ theme: string | null; updatedAt: string | null }>("/me/theme"),

  setTheme: (theme: string | null) => api.put<void>("/me/theme", { theme }),

  /** Identidade exibida: apelido, nome social e pronomes (campo nulo/vazio limpa). */
  setIdentity: (data: {
    nickname?: string | null;
    socialName?: string | null;
    pronouns?: string | null;
  }) => api.put<Profile>("/me/identity", data),

  /** Até 5 emblemas (URLs do CDN); lista vazia limpa. */
  setBadges: (badges: string[]) => api.put<Profile>("/me/badges", { badges }),

  /** Os últimos 3 kits de emblemas salvos, do mais recente para o mais antigo. */
  badgeKits: () => api.get<BadgeKit[]>("/me/badge-kits"),

  /** Volta a exibir um kit do histórico; o conjunto substituído entra no histórico por si. */
  applyBadgeKit: (kitId: string) =>
    api.post<Profile>(`/me/badge-kits/${encodeURIComponent(kitId)}/apply`),

  /**
   * Importar o ARQUIVO DE DADOS do LinkedIn (multipart): devolve o retrato parseado
   * para revisão — nada é salvo automaticamente.
   */
  importLinkedinArchive: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      // Through the shared client: same session refresh/retry as every other call.
      return await api.post<LinkedinImportPreview>("/me/import/linkedin", formData, {
        idempotent: false,
      });
    } catch (error) {
      // 413 may come from the API (IMPORT_TOO_LARGE) or from a proxy without a JSON body.
      if (
        error instanceof ApiError &&
        (error.status === 413 || error.code === "IMPORT_TOO_LARGE")
      ) {
        throw new Error(texts.errors.knownCodes.IMPORT_TOO_LARGE);
      }
      if (error instanceof ApiError && error.code) throw new Error(error.message);
      throw new Error("Não foi possível ler o arquivo do LinkedIn.");
    }
  },

  /**
   * Sincronização SEM ARQUIVO: a pessoa cola o texto do próprio perfil do LinkedIn (o que o
   * navegador copia) e o backend devolve o mesmo retrato para revisão.
   */
  importLinkedinText: (texto: string) =>
    api.post<LinkedinImportPreview>("/me/import/linkedin/texto", { texto }),
};
