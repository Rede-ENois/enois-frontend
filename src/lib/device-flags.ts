/**
 * Preferências que valem no aparelho, antes de qualquer resposta de rede.
 *
 * Um lugar só escreve no `localStorage` e avisa quem escuta: os modos econômicos (lite e BATATA),
 * a teimosia de animações e o 3D do cartão de perfil. Cada módulo tem o seu leitor com nome
 * próprio; a chave e o aviso moram aqui para não existir um segundo mecanismo de armazenamento.
 */
export const LITE_STORAGE_KEY = "connect-grow-lite-mode";
export const BATATA_STORAGE_KEY = "connect-grow-batata-mode";
export const FORCE_MOTION_STORAGE_KEY = "connect-grow-force-motion";
export const CARD_TILT_STORAGE_KEY = "connect-grow-card-tilt";

/** O nome do evento é o antigo: quem já escuta continua funcionando. */
const CHANGE_EVENT = "connect-grow-lite-flags-change";

const KEYS = [
  LITE_STORAGE_KEY,
  BATATA_STORAGE_KEY,
  FORCE_MOTION_STORAGE_KEY,
  CARD_TILT_STORAGE_KEY,
];

/** Lê a chave; ausente vale `fallback` (o mesmo primeiro paint do servidor). */
export function readDeviceFlag(key: string, fallback = false): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw === "1";
  } catch {
    return fallback;
  }
}

/** Espelha a escolha no aparelho (a conta é a fonte; isto é para o próximo paint). */
export function writeDeviceFlag(key: string, on: boolean): boolean {
  if (typeof window === "undefined") return on;
  try {
    window.localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* armazenamento bloqueado: a escolha vale só nesta aba */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return on;
}

/** Avisa quando qualquer uma das chaves muda (na aba ou em outra). */
export function subscribeDeviceFlags(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || KEYS.includes(event.key)) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
