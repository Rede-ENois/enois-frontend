import type { CallKind } from "@/types/application/call/call-kind";
import type { CallMediaOutcome } from "@/types/application/call/call-media-outcome";

/** Microfone e câmera já liberados nesta sessão da página: não vale perguntar de novo. */
let granted = false;

/**
 * Pede a permissão de microfone e câmera antes de a sala abrir.
 *
 * Por que isso existe: o painel abre um iframe do servidor de reunião, que é outro domínio. Se o
 * pedido partir de dentro do iframe, alguns navegadores móveis não mostram a pergunta — a sala
 * carrega sem áudio e sem vídeo e a pessoa não entende o motivo. Pedindo aqui, no clique dela e
 * na página do app, a pergunta aparece no celular também, e o painel só abre depois da resposta.
 *
 * As faixas são paradas logo em seguida de propósito: isto não é a chamada, é só a autorização.
 * Segurar a câmera aqui impediria o Epapo de abri-la depois.
 */
export async function requestCallMedia(kind: CallKind): Promise<CallMediaOutcome> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }
  // Já autorizado nesta sessão da página: não pede de novo. Reabrir o painel ou reconectar não
  // pode acender a câmera outra vez só para conferir uma permissão que já existe.
  if (granted) return "granted";
  const wantsVideo = kind === "VIDEO";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      // Voz pede só o microfone: abrir a câmera para uma chamada de áudio assusta e acende a luz
      // do aparelho sem motivo.
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: wantsVideo ? { facingMode: "user" } : false,
    });
    stream.getTracks().forEach((track) => track.stop());
    granted = true;
    return "granted";
  } catch (error) {
    // `NotAllowedError`/`SecurityError` = recusa; o resto (aparelho ausente, ocupado) é falta de
    // dispositivo. Os dois merecem um texto diferente na tela.
    const name = error instanceof DOMException ? error.name : "";
    return name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable";
  }
}
