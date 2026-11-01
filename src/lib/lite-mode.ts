/**
 * Modo lite: a versão enxuta do Énóis para aparelho fraco, bateria curta ou internet ruim.
 *
 * A escolha mora na conta (`liteMode` em /me/preferences) e é espelhada no aparelho para valer já
 * no primeiro paint, antes de qualquer resposta de rede. Quem manda nos efeitos é o atributo
 * `data-lite` no <html> (o CSS desliga animações e transições) mais os ajudantes daqui: páginas
 * maiores (menos idas ao servidor para rolar a mesma coisa), intervalos de recarga mais longos e
 * autoplay desligado.
 */
const LITE_STORAGE_KEY = "connect-grow-lite-mode";
const FORCE_MOTION_STORAGE_KEY = "connect-grow-force-motion";
const CARD_TILT_STORAGE_KEY = "connect-grow-card-tilt";
const CHANGE_EVENT = "connect-grow-lite-flags-change";

/** Cada lista pede isto de vezes mais itens por página em modo lite. */
export const LITE_PAGE_MULTIPLIER = 3;
/** Teto das listas: as paginadas por cursor cortam em 100 no backend. */
export const LITE_PAGE_MAX = 100;
/** Requisições de recarga automática (chat, convites) esperam isto de vezes mais. */
export const LITE_INTERVAL_MULTIPLIER = 4;

export function readLiteMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LITE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Espelha a escolha no aparelho (o backend é a fonte; isto é para o próximo paint). */
export function writeLiteMode(on: boolean): boolean {
  store(LITE_STORAGE_KEY, on);
  return on;
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
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FORCE_MOTION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeForceMotion(on: boolean): boolean {
  store(FORCE_MOTION_STORAGE_KEY, on);
  return on;
}

/**
 * Efeito 3D do cartão de perfil (inclinação e brilho ao passar o mouse). Ligado por padrão;
 * quem desliga guarda "0". É escolha do aparelho, então fica só nele.
 */
export function readCardTilt(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CARD_TILT_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeCardTilt(on: boolean): boolean {
  store(CARD_TILT_STORAGE_KEY, on);
  return on;
}

function store(key: string, on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* armazenamento bloqueado: a escolha vale só nesta aba */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Avisa quando qualquer uma das chaves muda (na aba ou em outra). */
export function subscribeLiteFlags(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === LITE_STORAGE_KEY ||
      event.key === FORCE_MOTION_STORAGE_KEY ||
      event.key === CARD_TILT_STORAGE_KEY
    ) {
      listener();
    }
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** O aparelho está pedindo menos movimento? (falso no servidor e onde não há suporte) */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
