/**
 * Captura do momento da denúncia.
 *
 * A sala é uma iframe de outro domínio (o Epapo), sem `allow-same-origin`: o app não consegue ler
 * nada de dentro dela. Quem tira a foto é a própria sala, quando o painel pede por `postMessage` —
 * um pedido, uma resposta, nada é capturado antes disso e nada fica guardado lá.
 *
 * A resposta só é aceita vindo da janela e da origem da iframe que fez o pedido: mensagem de outra
 * aba, de outro domínio ou com outro `requestId` é ignorada.
 */

const REQUEST = "enois:call-capture-request";
const RESPONSE = "enois:call-capture-response";
const FAILURE = "enois:call-capture-failed";

/** Tempo máximo esperando a sala desenhar o quadro. Sem resposta, a denúncia segue sem imagem. */
const TIMEOUT_MS = 5_000;

function originOf(frame: HTMLIFrameElement): string | null {
  try {
    return new URL(frame.src).origin;
  } catch {
    return null;
  }
}

/**
 * Pede uma fotografia do que está na tela agora e devolve a data URL JPEG, ou `null` quando a sala
 * não tem nada legível (só áudio, câmera desligada) ou não respondeu a tempo.
 */
export function requestCallCapture(
  frame: HTMLIFrameElement | null,
  timeoutMs = TIMEOUT_MS,
): Promise<string | null> {
  const target = frame?.contentWindow;
  const origin = frame ? originOf(frame) : null;
  if (!frame || !target || !origin) return Promise.resolve(null);

  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    let settled = false;

    const finish = (image: string | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      resolve(image);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== target) return;
      const data = event.data as { type?: string; requestId?: string; image?: unknown } | null;
      if (!data || data.requestId !== requestId) return;
      if (
        data.type === RESPONSE &&
        typeof data.image === "string" &&
        data.image.startsWith("data:image/")
      ) {
        finish(data.image);
      } else if (data.type === FAILURE) {
        finish(null);
      }
    };

    const timer = setTimeout(() => finish(null), timeoutMs);
    window.addEventListener("message", onMessage);
    target.postMessage({ type: REQUEST, requestId }, origin);
  });
}

/** A data URL vira arquivo para subir pelo mesmo caminho de mídia do resto do app. */
export function captureToFile(dataUrl: string, name = "captura-da-chamada.jpg"): File | null {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const header = dataUrl.slice(0, comma);
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? "image/jpeg";
  try {
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: mime });
  } catch {
    return null;
  }
}
