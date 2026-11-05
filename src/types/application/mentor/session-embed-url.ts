import type { SessionAccess } from "./session-access";

/**
 * Url do iframe da sala de mentoria no Epapo: o endereço da sala e o token curto vão juntos.
 *
 * O token é emitido pelo servidor de reunião depois de o backend confirmar que a pessoa participa
 * da sessão; o segredo de assinatura nunca chega ao navegador. Sala própria do mentor não passa
 * por aqui — é um link externo, aberto fora do app.
 */
export function sessionEmbedUrl(access: SessionAccess): string {
  const params = new URLSearchParams({ jwt: access.jwt ?? "" });
  // Mentoria é conversa: entra com microfone e câmera desligados e liga o que quiser.
  params.set("config.startAudioOnly", "false");
  params.set("config.startWithAudioMuted", "true");
  params.set("config.startWithVideoMuted", "true");
  // Nada de gravação/streaming na tela: o token já as desliga, e a UI não oferece.
  params.set("config.disableDeepLinking", "true");
  params.set("config.prejoinPageEnabled", "false");
  params.set("config.requireDisplayName", "false");
  params.set("interfaceConfig.SHOW_JITSI_WATERMARK", "false");
  return `${access.roomUrl}?${params.toString()}`;
}
