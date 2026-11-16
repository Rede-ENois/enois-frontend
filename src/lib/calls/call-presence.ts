/**
 * Sinal de vida da sala.
 *
 * A presença no servidor nasce na entrada e não dura sozinha: quem some sem desligar (aba
 * fechada, rede perdida) deixa de contar como gente depois da janela do servidor, e a sala sem
 * ninguém vivo fecha pelo worker. O ping é o que diz "esta pessoa segue aqui" enquanto a sala
 * está aberta — e falha de ping não ensaia erro na tela: o próximo intervalo tenta de novo.
 */

/** O servidor tolera duas batidas perdidas; um minuto entre pings folga o dobro disso. */
export const PRESENCE_PING_INTERVAL_MS = 60_000;

/**
 * Pinga a presença em intervalo fixo até que o chamador pare. Devolve a função que desliga o
 * intervalo — é o cleanup do efeito que mantém o ping vivo na tela da chamada.
 */
export function startPresencePing(
  callId: string,
  ping: (callId: string) => Promise<unknown>,
  intervalMs: number = PRESENCE_PING_INTERVAL_MS,
): () => void {
  const timer = window.setInterval(() => {
    void ping(callId).catch(() => {
      // Rede fora, chamada que acabou do outro lado: o intervalo segue e o servidor não muda
      // por causa de um ping perdido.
    });
  }, intervalMs);
  return () => window.clearInterval(timer);
}
