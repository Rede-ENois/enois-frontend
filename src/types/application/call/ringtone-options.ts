/** Opções do toque da chamada recebida. */
export interface RingtoneOptions {
  /** Pede o toque (padrão) ou silêncio. */
  enabled: boolean;
  /**
   * ID da chamada que está tocando: as notas do toque derivam dele, para a mesma chamada soar
   * sempre igual a si mesma e as outras soarem diferentes.
   */
  callId?: string;
}
