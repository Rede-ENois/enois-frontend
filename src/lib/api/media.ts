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
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    try {
      const parsed = new URL(cleaned, window.location.href);
      const isLocal =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (
        isLocal &&
        (parsed.pathname.startsWith("/api/storage/") || parsed.pathname.startsWith("/storage/"))
      ) {
        return parsed.pathname.startsWith("/api/") ? parsed.pathname : `/api${parsed.pathname}`;
      }
    } catch {
      // Caminho relativo ou URL opaca: segue para os fallbacks comuns.
    }
  }
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `${IMAGEKIT_URL_ENDPOINT}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
}

export function resolveUploadTarget(signedUrl: string): { uploadUrl: string; toApi: boolean } {
  if (typeof window === "undefined") {
    return { uploadUrl: signedUrl, toApi: false };
  }

  try {
    const parsed = new URL(signedUrl, window.location.href);
    const apiOrigin = new URL(apiUrl("/"), window.location.href).origin;
    const isStoragePath =
      parsed.pathname.startsWith("/api/storage/") || parsed.pathname.startsWith("/storage/");
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const toApi =
      parsed.origin === apiOrigin || (isStoragePath && (isLocal || Boolean(import.meta.env.DEV)));

    if (toApi && isStoragePath && (isLocal || Boolean(import.meta.env.DEV))) {
      const storagePath = parsed.pathname.startsWith("/api/")
        ? parsed.pathname.slice(4)
        : parsed.pathname;
      return {
        uploadUrl: `${apiUrl(storagePath)}${parsed.search}`,
        toApi: true,
      };
    }

    return { uploadUrl: signedUrl, toApi };
  } catch {
    return { uploadUrl: signedUrl, toApi: false };
  }
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
   * XHR em vez de fetch: o fetch não reporta bytes enviados, e o PUT é a fase mais longa do
   * upload — sem ele a barra ficava congelada na compressão e pulava para 100% no fim (#925).
   */
  uploadToSignedUrl: async (
    signedUrl: string,
    file: File,
    headers: Record<string, string> = {},
    onProgress?: (fracao: number) => void,
    signal?: AbortSignal,
  ) => {
    const { uploadUrl, toApi } = resolveUploadTarget(signedUrl);

    const resposta = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", uploadUrl, true);
      request.withCredentials = toApi;
      for (const [nome, valor] of Object.entries(
        toApi ? { ...headers, ...sessionHeaders() } : headers,
      )) {
        request.setRequestHeader(nome, valor);
      }
      if (signal) {
        // Abortar depois de enviado não cancela nada: só encerra a espera pela resposta.
        if (signal.aborted) return reject(new DOMException("Envio cancelado.", "AbortError"));
        signal.addEventListener("abort", () => request.abort(), { once: true });
      }
      request.upload.onprogress = (evento) => {
        if (evento.lengthComputable && onProgress) {
          onProgress(evento.loaded / evento.total);
        }
      };
      request.onload = () =>
        resolve({ status: request.status, body: request.responseText.slice(0, 4096) });
      request.onerror = () =>
        reject(
          new Error(
            `Upload falhou: falha de rede ao falar com ${new URL(uploadUrl, window.location.href).host}`,
          ),
        );
      request.onabort = () => reject(new DOMException("Envio cancelado.", "AbortError"));
      request.send(file);
    });

    if (resposta.status < 200 || resposta.status >= 300) {
      if (toApi) {
        const path = new URL(uploadUrl, window.location.href).pathname;
        throw mediaUploadResponseError(resposta.status, resposta.body, path);
      }
      throw new Error(`Upload falhou: ${resposta.status} ${resposta.body}`);
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
