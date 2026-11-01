/** Os controles de personalização da conta (GET/PUT /me/preferences). */
export type Personalization = {
  likedTopics: string[];
  blockedTopics: string[];
  disabledModules: string[];
  /** Lembrete de descanso entre 00:00 e 04:59 no relógio do aparelho. */
  nightRestReminder: boolean;
  /** Data local (AAAA-MM-DD) da noite em que o popup foi dispensado; null = nunca. */
  nightRestDismissedOn: string | null;
  /**
   * Modo lite: sem animações, páginas maiores e cache mais folgado — para aparelho fraco,
   * bateria curta ou internet ruim. A interface é a mesma.
   */
  liteMode: boolean;
  /**
   * Modo BATATA: interface clássica e econômica para aparelho com pouca memória ou processador
   * fraco. É independente do lite na conta (ligar um não mexe no outro); a apresentação soma os
   * dois — BATATA implica os efeitos do lite.
   */
  batataMode: boolean;
};
