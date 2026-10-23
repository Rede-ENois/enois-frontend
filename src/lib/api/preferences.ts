import type { Personalization } from "@/types/application/preferences/personalization";
import type { LinkedinImportPreview } from "@/types/application/profile/linkedin-import-preview";
import type { Profile } from "@/types/application/profile/profile";

import { api } from "../api-client";
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

  /**
   * Importar o ARQUIVO DE DADOS do LinkedIn (multipart): devolve o retrato parseado
   * para revisão — nada é salvo automaticamente. Usa fetch direto (multipart).
   */
  importLinkedinArchive: async (file: File) => {
    const { apiUrl, getSessionToken } = await import("../api-client");
    const formData = new FormData();
    formData.append("file", file);
    // URL absoluta (`apiUrl`): o host do front não serve `/api` em produção, e o multipart
    // relativo ia parar no 404 do próprio front.
    const response = await fetch(apiUrl("/me/import/linkedin"), {
      method: "POST",
      headers: { "X-Session-Token": getSessionToken() ?? "", ...clientOriginHeader() },
      body: formData,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "Não foi possível ler o arquivo do LinkedIn.");
    }
    return (await response.json()) as LinkedinImportPreview;
  },

  /**
   * Sincronização SEM ARQUIVO: a pessoa cola o texto do próprio perfil do LinkedIn (o que o
   * navegador copia) e o backend devolve o mesmo retrato para revisão.
   */
  importLinkedinText: (texto: string) =>
    api.post<LinkedinImportPreview>("/me/import/linkedin/texto", { texto }),
};
