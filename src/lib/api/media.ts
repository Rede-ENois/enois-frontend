import { texts } from "@/texts";
import type { MediaAsset } from "@/types/application/media/media-asset";
import type { MediaUploadResponse } from "@/types/application/media/media-upload-response";

import { ApiError, api, apiUrl, sessionHeaders } from "../api-client";

const IMAGEKIT_URL_ENDPOINT =
  import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? "https://ik.imagekit.io/socialcoisa";

export function mediaUploadResponseError(status: number, body: string, path: string): ApiError {
  let payload: { code?: string; message?: string } | null = null;
  try {
    payload = JSON.parse(body) as { code?: string; message?: string };
  } catch {
    // Proxy or gateway returned a non-JSON body.
  }
  const code = payload?.code;
  const message = code
    ? (texts.errors.apiMessages[code] ??
      texts.errors.knownCodes[code as keyof typeof texts.errors.knownCodes] ??
      payload?.message)
    : payload?.message;
  return new ApiError(status, code, message ?? `Upload falhou: ${status}`, path);
}

export function resolveCdnUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const cleaned = url.replace(/%2F/g, "/");
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  // Storage local de dev (`rede.media.storage=local`): o cdnUrl é um caminho relativo servido pela
  // própria API (`/api/storage/...`), não um caminho do ImageKit. Deixar relativo faz a mídia
  // carregar da mesma origem do app (proxy do Vite), sem host fixo nem CSP extra.
  if (cleaned.startsWith("/api/storage/") || cleaned.startsWith("/storage/")) return cleaned;
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
   *
   * Usa `XMLHttpRequest` (e não `fetch`) porque só ele emite `progress` — o `fetch` não tem API de
   * progresso e fingir o percentual deixaria a pessoa guiando por um número que não é o dela. O
   * cancelamento é feito via `AbortSignal`, suportado pelo XHR.
   */
  uploadToSignedUrl: async (
    signedUrl: string,
    file: File,
    headers: Record<string, string> = {},
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ) => {
    // Only the API's own storage gateway gets the session cookies and CSRF header: a bucket URL
    // signed by AWS would refuse a credentialed CORS request.
    const toApi =
      typeof window !== "undefined" &&
      new URL(signedUrl, window.location.href).origin ===
        new URL(apiUrl("/"), window.location.href).origin;
    const finalHeaders = toApi ? { ...headers, ...sessionHeaders() } : headers;

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.withCredentials = toApi;
      for (const [key, value] of Object.entries(finalHeaders)) {
        xhr.setRequestHeader(key, value);
      }

      const cleanup = () => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
      };
      const onAbort = () => xhr.abort();
      if (signal) {
        if (signal.aborted) {
          xhr.abort();
        } else {
          signal.addEventListener("abort", onAbort);
        }
      }

      xhr.onload = () => {
        cleanup();
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        const body = xhr.responseText ?? "";
        if (toApi) {
          const path = new URL(signedUrl, window.location.href).pathname;
          reject(mediaUploadResponseError(xhr.status, body, path));
          return;
        }
        reject(new Error(`Upload falhou: ${xhr.status} ${body}`));
      };
      xhr.onerror = () => {
        cleanup();
        reject(new Error(`Upload falhou: ${xhr.status}`));
      };
      xhr.onabort = () => {
        cleanup();
        reject(new Error("Upload cancelado."));
      };
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.send(file);
    });
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
