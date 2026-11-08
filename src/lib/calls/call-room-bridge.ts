/**
 * Avisos que a sala (iframe do Epapo) manda para o app.
 *
 * O painel da chamada é uma iframe de outro domínio, sem `allow-same-origin`: o app não lê nada
 * de dentro dela. Quando a pessoa desliga pela barra da própria sala, quem sabe disso é a sala, e
 * ela avisa por `postMessage`. Sem esse aviso, a tela continuaria mostrando o iframe de uma
 * chamada que a pessoa já deixou — e a próxima resposta do servidor reabriria o painel.
 *
 * A mensagem só é aceita quando vem da janela da iframe e da origem dela. Mensagem de outra aba,
 * de outro domínio ou de uma iframe que já saiu da tela é ignorada.
 */
import type { RoomExitMessage } from "@/types/application/call/room-exit-message";

/** A pessoa saiu da sala (desligou na barra do Epapo, ou a sala a retirou). */
export const ROOM_EXIT = "enois:call-room-exit";

function originOf(frame: HTMLIFrameElement): string | null {
  try {
    return new URL(frame.src).origin;
  } catch {
    return null;
  }
}

/**
 * Escuta o aviso de saída da sala embutida e chama `onExit` uma vez por aviso recebido.
 * Devolve a função que desliga a escuta.
 *
 * A checagem é a mesma da captura: origem igual à da iframe e `event.source` igual à janela dela.
 * Nenhum campo da mensagem vira ação direta — o chamador refaz o estado pelo servidor.
 */
export function subscribeToRoomExit(
  frame: HTMLIFrameElement | null,
  onExit: (message: RoomExitMessage) => void,
): () => void {
  const target = frame?.contentWindow;
  const origin = frame ? originOf(frame) : null;
  if (!target || !origin) return () => {};

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== origin || event.source !== target) return;
    const data = event.data as { type?: unknown; reason?: unknown } | null;
    if (!data || data.type !== ROOM_EXIT) return;
    onExit({
      type: ROOM_EXIT,
      reason: typeof data.reason === "string" ? data.reason.slice(0, 64) : undefined,
    });
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
