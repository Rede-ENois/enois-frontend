import { readBatataMode } from "./batata-mode";
import {
  CARD_TILT_STORAGE_KEY,
  FORCE_MOTION_STORAGE_KEY,
  LITE_STORAGE_KEY,
  readDeviceFlag,
  subscribeDeviceFlags,
  writeDeviceFlag,
} from "./device-flags";

/**
 * Modo lite: a versão enxuta do Énóis para aparelho fraco, bateria curta ou internet ruim.
 *
 * A escolha mora na conta (`liteMode` em /me/preferences) e é espelhada no aparelho para valer já
 * no primeiro paint, antes de qualquer resposta de rede. Quem manda nos efeitos é o atributo
 * `data-lite` no <html> (o CSS desliga animações e transições) mais os ajudantes daqui: páginas
 * maiores (menos idas ao servidor para rolar a mesma coisa), intervalos de recarga mais longos e
 * autoplay desligado.
 *
 * O BATATA entra como um **superconjunto**: quem liga o BATATA ganha os mesmos efeitos sem que a
 * chave do lite mude. Por isso o resto do app usa `readEconomicMode()` — ou o `useLiteMode()`, que
 * já soma os dois — em vez de `readLiteMode()`.
 */

/** Cada lista pede isto de vezes mais itens por página em modo lite. */
export const LITE_PAGE_MULTIPLIER = 3;
/** Teto das listas: as paginadas por cursor cortam em 100 no backend. */
export const LITE_PAGE_MAX = 100;
/** Requisições de recarga automática (chat, convites) esperam isto de vezes mais. */
export const LITE_INTERVAL_MULTIPLIER = 4;

export function readLiteMode(): boolean {
  return readDeviceFlag(LITE_STORAGE_KEY);
}

/** Espelha a escolha no aparelho (o backend é a fonte; isto é para o próximo paint). */
export function writeLiteMode(on: boolean): boolean {
  return writeDeviceFlag(LITE_STORAGE_KEY, on);
}

/**
 * Algum modo econômico ligado neste aparelho? (lite ou BATATA)
 *
 * É o valor que a apresentação usa: o BATATA não é uma preferência separada de desempenho, ele
 * soma os efeitos do lite. A chave do lite continua intacta — desligar o BATATA devolve a tela ao
 * que o lite era antes.
 */
export function readEconomicMode(): boolean {
  return readLiteMode() || readBatataMode();
}

export function litePageSize(base: number, lite: boolean): number {
  return lite ? Math.min(LITE_PAGE_MAX, base * LITE_PAGE_MULTIPLIER) : base;
}

export function liteInterval(baseMs: number, lite: boolean): number {
  return lite ? baseMs * LITE_INTERVAL_MULTIPLIER : baseMs;
}

/**
 * Animações mesmo com o sistema pedindo para reduzir movimento.
 *
 * O sistema (Ajustes → Acessibilidade no iPhone, "Remover animações" no Android) silencia as
 * molduras animadas e os efeitos — a gente respeita por padrão. Quem QUER ver as animações nesse
 * aparelho liga esta chave; é escolha do aparelho, então fica só nele.
 */
export function readForceMotion(): boolean {
  return readDeviceFlag(FORCE_MOTION_STORAGE_KEY);
}

export function writeForceMotion(on: boolean): boolean {
  return writeDeviceFlag(FORCE_MOTION_STORAGE_KEY, on);
}

/**
 * Efeito 3D do cartão de perfil (inclinação e brilho ao passar o mouse). Ligado por padrão;
 * quem desliga guarda "0". É escolha do aparelho, então fica só nele.
 */
export function readCardTilt(): boolean {
  return readDeviceFlag(CARD_TILT_STORAGE_KEY, true);
}

export function writeCardTilt(on: boolean): boolean {
  return writeDeviceFlag(CARD_TILT_STORAGE_KEY, on);
}

/** Avisa quando qualquer uma das chaves muda (na aba ou em outra). */
export function subscribeLiteFlags(listener: () => void): () => void {
  return subscribeDeviceFlags(listener);
}

/** O aparelho está pedindo menos movimento? (falso no servidor e onde não há suporte) */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
