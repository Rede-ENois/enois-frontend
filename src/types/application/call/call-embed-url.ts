import type { CallJoin } from "./call-join";

/** Url do iframe do Jitsi: a sala e o token vão juntos, sem segredo nenhum no cliente. */
export function callEmbedUrl(join: CallJoin): string {
  const params = new URLSearchParams({ jwt: join.jwt });
  // Começa com o microfone e a câmera desligados exceto quando a chamada é de vídeo pedida por
  // quem ligou: ninguém entra com mídia ligada sem escolher.
  params.set("config.startAudioOnly", join.kind === "AUDIO" ? "true" : "false");
  params.set("config.startWithAudioMuted", "false");
  params.set("config.startWithVideoMuted", join.kind === "AUDIO" ? "true" : "false");
  // Nada de gravação/streaming na tela: o token já as desliga, e a UI não oferece.
  params.set("config.disableDeepLinking", "true");
  params.set("config.prejoinPageEnabled", "false");
  params.set("config.requireDisplayName", "false");
  params.set("interfaceConfig.SHOW_JITSI_WATERMARK", "false");
  return `${join.host}/${join.room}?${params.toString()}`;
}
