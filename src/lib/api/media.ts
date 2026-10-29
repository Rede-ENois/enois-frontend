import type { MediaAsset } from "@/types/application/media/media-asset";
import type { MediaUploadResponse } from "@/types/application/media/media-upload-response";

import { api, apiUrl, sessionHeaders } from "../api-client";

const IMAGEKIT_URL_ENDPOINT =
  import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? "https://ik.imagekit.io/socialcoisa";

export function resolveCdnUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const cleaned = url.replace(/%2F/g, "/");
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `${IMAGEKIT_URL_ENDPOINT}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
}

/**
 * Vídeo/áudio do ImageKit tem de pedir o ORIGINAL (`tr=orig-true`).
 *
 * Sem esse parâmetro a entrega conta como transformação de vídeo; quando a cota da conta
 * estoura, o CDN responde 403 com `ik-error: ELIMIT` e o player mostra um quadro quebrado. O
 * arquivo original aceita Range normalmente (206), então o vídeo volta a tocar sem upgrade de
 * plano. Em S3 (ou qualquer outro host) a URL fica intacta.
 */
export function withImageKitOriginal(url: string | null | undefined): string | undefined {
  const resolved = resolveCdnUrl(url);
  if (!resolved) return undefined;
  try {
    const parsed = new URL(resolved);
    if (!parsed.hostname.endsWith("imagekit.io")) return resolved;
    if (!parsed.searchParams.has("tr")) parsed.searchParams.set("tr", "orig-true");
    return parsed.toString();
  } catch {
    return resolved;
  }
}

const IMAGEKIT_HOST = (() => {
  try {
    return new URL(IMAGEKIT_URL_ENDPOINT).host;
  } catch {
    return "";
  }
})();

/**
 * CDNs de figurinha (BTTV/FFZ). Hoje o catálogo e as imagens saem do NOSSO backend, mas o endereço
 * de um CDN desses pode aparecer em texto antigo — imagem que o app mostra de propósito, nunca uma
 * URL escolhida por quem escreveu.
 */
const EMOTE_HOSTS = new Set(["cdn.betterttv.net", "cdn.frankerfacez.com"]);

/**
 * Host da nossa API, onde moram as imagens do catálogo de figurinhas (`/emotes/image/...`).
 *
 * Em produção a API está em outro host (`https://api.enois.ia.br/api`), então sem esta entrada a
 * figurinha servida pelo proxy viraria LINK dentro do texto. Em dev o endereço é relativo e cai no
 * mesmo host do app.
 */
const API_HOST = (() => {
  try {
    return new URL(apiUrl("/"), "http://localhost").host;
  } catch {
    return "";
  }
})();

/**
 * O endereço é de mídia nossa (caminho relativo, mesmo host do app, a API ou o CDN que a gente usa)?
 *
 * Serve para decidir o que pode virar imagem num texto formatado: imagem de servidor de
 * terceiro carrega sozinha e entrega o IP de quem lê para quem publicou, então ela sai como link.
 */
export function isOwnMediaUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return true;

  try {
    const parsed = new URL(url);
    if (typeof window !== "undefined" && parsed.host === window.location.host) return true;
    if (API_HOST !== "" && parsed.host === API_HOST) return true;
    if (EMOTE_HOSTS.has(parsed.host)) return true;
    return IMAGEKIT_HOST !== "" && parsed.host === IMAGEKIT_HOST;
  } catch {
    return false;
  }
}

export const mediaApi = {
  requestUpload: (data: Pick<MediaAsset, "fileName" | "mimeType" | "size" | "purpose">) =>
    api.post<MediaUploadResponse>("/media/uploads", data),

  get: (mediaId: string) => api.get<MediaAsset>(`/media/${mediaId}`),

  delete: (mediaId: string) => api.delete<Pick<MediaAsset, "id" | "status">>(`/media/${mediaId}`),

  /**
   * Sobe o arquivo para o endereço que o servidor devolveu.
   *
   * Os cabecalhos vêm assinados pelo servidor: o `Content-Type` precisa ser EXATAMENTE o mesmo, ou
   * o storage recusa a subida. Com o gateway do b7 a subida passa pelo próprio app
   * (`PUT /api/storage/{chave}`), que exige a sessão de quem é dono do asset — por isso os cookies
   * vão junto. Na AWS, a URL assinada direto no bucket ignora esse cabecalho extra.
   */
  uploadToSignedUrl: async (
    signedUrl: string,
    file: File,
    headers: Record<string, string> = {},
  ) => {
    // Only the API's own storage gateway gets the session cookies and CSRF header: a bucket URL
    // signed by AWS would refuse a credentialed CORS request.
    const toApi =
      typeof window !== "undefined" &&
      new URL(signedUrl, window.location.href).origin ===
        new URL(apiUrl("/"), window.location.href).origin;
    const response = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      credentials: toApi ? "include" : "same-origin",
      headers: toApi ? { ...headers, ...sessionHeaders() } : headers,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Upload falhou: ${response.status} ${body}`);
    }
  },

  /**
   * ImageKit DESATIVADO (19/10/2026): o provedor foi comprometido e nao recebe mais arquivo.
   * A funcao fica apenas para nao quebrar chamadas antigas — ela SEMPRE falha com mensagem clara.
   */
  uploadToImageKit: async () => {
    throw new Error(
      "O envio de mídia pelo ImageKit foi desativado. Aguarde a migração para o novo armazenamento.",
    );
  },
};
