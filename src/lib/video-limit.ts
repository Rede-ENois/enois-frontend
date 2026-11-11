import type { VideoLimitResult } from "@/types/media-upload/video-limit-result";

/** Teto de vídeo no upload (issue #656): 10MB, o mesmo do servidor (MediaService.MAX_VIDEO_BYTES). */
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

/** Duração máxima de vídeo (issue #656): 3 minutos, o mesmo do servidor. */
export const MAX_VIDEO_SECONDS = 3 * 60;

const VIDEO_MIME_PREFIX = "video/";

export function isVideoFile(file: File): boolean {
  return file.type.startsWith(VIDEO_MIME_PREFIX);
}

/**
 * Checagem de vídeo no cliente (#656): tamanho vem do próprio arquivo, duração é lida do
 * elemento de mídia. Serve para avisar antes de o upload sair — o servidor continua sendo quem
 * recusa de verdade (ffprobe + teto por MIME). Se a duração não puder ser lida (navegador sem
 * suporte ao contêiner), a checagem local de duração é pulada e só o tamanho vale: barrar aqui um
 * arquivo que o servidor aceitaria quebraria o upload que hoje funciona.
 */
export async function checkVideoLimit(file: File): Promise<VideoLimitResult> {
  if (file.size > MAX_VIDEO_BYTES) {
    return { ok: false, reason: "size", maxBytes: MAX_VIDEO_BYTES, maxSeconds: MAX_VIDEO_SECONDS };
  }
  const seconds = await readDurationSeconds(file);
  if (seconds === null) {
    return { ok: true };
  }
  if (seconds > MAX_VIDEO_SECONDS + 0.5) {
    return {
      ok: false,
      reason: "duration",
      maxBytes: MAX_VIDEO_BYTES,
      maxSeconds: MAX_VIDEO_SECONDS,
    };
  }
  return { ok: true };
}

/**
 * Duração em segundos lida pelo elemento de mídia, em segundos fracionários. Retorna {@code null}
 * quando o navegador não decodifica o arquivo (contêiner desconhecido ou metadados corrompidos):
 * nesse caso quem decide é o servidor.
 */
function readDurationSeconds(file: File): Promise<number | null> {
  if (typeof document === "undefined") {
    return Promise.resolve(null);
  }
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const finish = (value: number | null) => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => {
      const duration = video.duration;
      finish(Number.isFinite(duration) && duration > 0 ? duration : null);
    };
    video.onerror = () => finish(null);
    // Metadados que nunca chegam não podem segurar o upload: sem duração, quem decide é o servidor.
    window.setTimeout(() => finish(null), 4000);
    video.src = url;
  });
}
