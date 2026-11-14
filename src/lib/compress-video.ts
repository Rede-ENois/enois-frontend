import type { VideoCompressionStep } from "@/types/media-upload/video-compression-step";

import { MAX_VIDEO_BYTES } from "@/lib/video-limit";

/**
 * Compressão de vídeo no cliente, antes do upload (#656): a API aceita no máximo 10 MB, e um
 * vídeo de celular de 30 segundos sai com 40–80 MB. Sem isto, a pessoa filma, espera o envio
 * inteiro e leva a recusa do servidor no fim.
 *
 * Sem biblioteca nova: o navegador já sabe decodificar (`<video>`), redimensionar (`canvas`) e
 * recodificar (`MediaRecorder`). O pipeline é quadro a quadro, em pares de resolução e bitrate
 * que se reduzem até o arquivo caber. O resultado é WebM (VP8/VP9), que está na lista de tipos
 * aceitos pelo servidor.
 *
 * Nada de segurança fica do lado do cliente: o servidor continua validando tipo, tamanho e
 * duração (ffprobe). Esta compressão só evita o envio que seria recusado.
 */

/** Resoluções testadas, do maior para o menor. O lado menor mantém a proporção. */
const LADDER: ReadonlyArray<VideoCompressionStep> = [
  { maxSide: 1280, videoBitsPerSecond: 2_000_000 },
  { maxSide: 960, videoBitsPerSecond: 1_200_000 },
  { maxSide: 720, videoBitsPerSecond: 700_000 },
  { maxSide: 480, videoBitsPerSecond: 400_000 },
];

/** Áudio em AAC/Opus, taxa fixa: fala em vídeo curto não precisa de mais. */
const AUDIO_BITS_PER_SECOND = 64_000;

/** Recusa local quando nem a menor combinação cabe: a pessoa precisa encurtar o vídeo. */
export class VideoCompressionError extends Error {
  constructor() {
    super("Não foi possível reduzir o vídeo para o limite da rede.");
    this.name = "VideoCompressionError";
  }
}

export function supportsVideoCompression(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function" &&
    MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
  );
}

/** Dimensões de saída: proporção mantida, nunca aumenta, lados pares (o VP8 exige). */
export function scaledDimensions(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const longSide = Math.max(width, height);
  if (longSide <= 0) {
    return { width: 0, height: 0 };
  }
  const scale = longSide <= maxSide ? 1 : maxSide / longSide;
  const even = (value: number) => Math.max(2, Math.round((value * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
}

/**
 * Recodifica o vídeo em WebM com a resolução e o bitrate pedidos.
 *
 * A gravação acompanha a reprodução em tempo quase real (o `captureStream` do canvas emite
 * quadros na cadência do `requestVideoFrameCallback`/`requestAnimationFrame`); para um vídeo de
 * até 3 minutos é o custo aceitável de não subir o arquivo para um servidor de transcodificação.
 * Qualquer falha (codec ausente, decodificação recusada) lança, e o chamador devolve o arquivo
 * original — compressão que tropeça não pode quebrar o upload que hoje funciona.
 */
async function reencode(file: File, options: VideoCompressionStep): Promise<File | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await once(video, "loadedmetadata");
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) {
      return null;
    }

    const size = scaledDimensions(width, height, options.maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    const stream = canvas.captureStream(30);
    // O áudio vem do próprio elemento: o canvas só carrega a imagem.
    const capturedAudio = captureElementAudio(video);
    if (capturedAudio) {
      stream.addTrack(capturedAudio);
    }

    const mimeType = "video/webm;codecs=vp8,opus";
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
      videoBitsPerSecond: options.videoBitsPerSecond,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    const stopped = once(recorder, "stop");

    let drawing = true;
    const draw = () => {
      if (!drawing) {
        return;
      }
      context.drawImage(video, 0, 0, size.width, size.height);
      window.requestAnimationFrame(draw);
    };

    // Os ouvintes entram antes do play: no vídeo curto o "ended" pode chegar antes de a
    // promessa do play resolver, e ouvir depois perderia o evento.
    const ended = once(video, "ended");
    recorder.start();
    draw();
    await video.play();
    await ended;

    drawing = false;
    recorder.stop();
    await stopped;
    capturedAudio?.stop();

    const blob = new Blob(chunks, { type: "video/webm" });
    if (blob.size === 0) {
      return null;
    }
    return renameAsWebm(file, blob);
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

function captureElementAudio(video: HTMLVideoElement): MediaStreamTrack | null {
  try {
    const withCapture = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const capture = withCapture.captureStream ?? withCapture.mozCaptureStream;
    const stream = capture?.call(video);
    return stream?.getAudioTracks()[0] ?? null;
  } catch {
    // Sem áudio capturável: o vídeo sai mudo, mas sai.
    return null;
  }
}

function once(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`video: ${event} falhou`));
    };
    const cleanup = () => {
      target.removeEventListener(event, onEvent);
      target.removeEventListener("error", onError);
    };
    target.addEventListener(event, onEvent, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

function renameAsWebm(original: File, blob: Blob): File {
  const base = original.name.replace(/\.[^.]+$/, "") || "video";
  return new File([blob], `${base}.webm`, {
    type: "video/webm",
    lastModified: original.lastModified,
  });
}

/**
 * Devolve um arquivo de vídeo que cabe no teto da API, ou o próprio arquivo quando ele já cabe
 * (ou quando o navegador não sabe recodificar, caso em que a checagem de limite decide).
 *
 * `onAttempt` recebe cada combinação testada, para a tela mostrar "reduzindo qualidade".
 */
export async function compressVideo(
  file: File,
  onAttempt?: (progress: number) => void,
): Promise<File> {
  if (file.size <= MAX_VIDEO_BYTES || !supportsVideoCompression()) {
    return file;
  }

  for (let index = 0; index < LADDER.length; index += 1) {
    onAttempt?.(Math.round((index / LADDER.length) * 100));
    const candidate = await reencode(file, LADDER[index]);
    if (!candidate) {
      return file;
    }
    if (candidate.size <= MAX_VIDEO_BYTES) {
      onAttempt?.(100);
      return candidate;
    }
  }
  throw new VideoCompressionError();
}
