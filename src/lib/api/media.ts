import type { MediaAsset } from "@/types/application/media/media-asset";
import type { MediaUploadResponse } from "@/types/application/media/media-upload-response";

import { api, getSessionToken } from "../api-client";

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
 * O endereço é de mídia nossa (caminho relativo, mesmo host do app ou o CDN que a gente usa)?
 *
 * Serve para decidir o que pode virar imagem num texto formatado: imagem de servidor de terceiro
 * carrega sozinha e entrega o IP de quem lê para quem publicou, então ela sai como link.
 */
export function isOwnMediaUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return true;

  try {
    const parsed = new URL(url);
    if (typeof window !== "undefined" && parsed.host === window.location.host) return true;
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
   * Sobe o arquivo direto no storage por URL assinada (S3).
   *
   * Os cabecalhos vêm assinados pelo servidor: o `Content-Type` precisa ser EXATAMENTE o mesmo, ou
   * o S3 recusa a subida (403). Nada de credencial aqui — a URL já autoriza aquela subida.
   */
  uploadToSignedUrl: async (
    signedUrl: string,
    file: File,
    headers: Record<string, string> = {},
  ) => {
    const response = await fetch(signedUrl, { method: "PUT", body: file, headers });

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
