import type { CallJoin } from "./call-join";

/**
 * Opções do Jitsi que a tela precisa ligar ou desligar por sala.
 *
 * O parâmetro `jwt` é lido da query e da barra; todo o resto, só da barra (`#`) — é onde o
 * `setConfigFromURLParams` do Epapo procura. Um `config.*` na query é ignorado sem aviso, e é por
 * isso que a chamada abria com P2P ligado mesmo com o pedido de desligar.
 *
 * Além disso o Epapo só aceita a chave que está na lista de override dele (`configWhitelist.ts`
 * e `interfaceConfigWhitelist.ts`); chave fora da lista também é descartada em silêncio.
 */
const CONFIG: Array<[string, (join: CallJoin) => string]> = [
  // Tudo pela ponte de vídeo do servidor. Com P2P ligado, dois participantes montam a conexão
  // direta e a chamada deixa de passar pelo Epapo; com três ou mais a sala é remontada na ponte
  // no meio do caminho e as pessoas caem.
  ["config.p2p.enabled", () => "false"],
  // Começa com a câmera desligada na chamada de áudio: ninguém abre a câmera sem escolher.
  ["config.startWithVideoMuted", (join) => (join.kind === "AUDIO" ? "true" : "false")],
  // Abre direto na sala. O nome do Epapo é `prejoinConfig.enabled`; `prejoinPageEnabled` é o
  // nome antigo e não está na lista de override dele.
  ["config.prejoinConfig.enabled", () => "false"],
  ["config.disableDeepLinking", () => "true"],
];

/** Url do iframe do Jitsi: a sala e o token vão juntos, sem segredo nenhum no cliente. */
export function callEmbedUrl(join: CallJoin): string {
  const search = new URLSearchParams({ jwt: join.jwt });
  return `${join.host}/${join.room}?${search.toString()}${callEmbedHash(join)}`;
}

/**
 * A fração `#config.*` da URL do iframe.
 *
 * Fica exportada para a prova: o teste confere que cada chave sai daqui e que todas são
 * aplicadas pelo próprio Epapo, para uma opção nova não voltar a morrer em silêncio.
 */
export function callEmbedHash(join: CallJoin): string {
  const hash = new URLSearchParams(CONFIG.map(([key, value]) => [key, value(join)]));
  return `#${hash.toString()}`;
}
