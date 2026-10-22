import { useSyncExternalStore } from "react";

import { randomUUID } from "./random-uuid";

/**
 * Identifica a sessão (o login), não o token: renovar o token mantém a chave, entrar em outra conta
 * gera outra. É o que distingue as duas coisas quando a troca acontece em outra aba.
 */
const SESSION_KEY = "session_id";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function getSessionKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

/**
 * `crypto.randomUUID` só existe em contexto seguro (HTTPS/localhost). Em HTTP (por exemplo o
 * servidor de dev acessado pelo IP da rede) o login quebrava com "randomUUID is not a function".
 * A chave só precisa ser imprevisível, então cai para `getRandomValues`/Math.random com o formato
 * de UUID v4.
 */
function newSessionId(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (webCrypto && typeof webCrypto.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function renewSessionKey() {
  const id = newSessionId();
  localStorage.setItem(SESSION_KEY, id);
  notify();
}

export function dropSessionKey() {
  localStorage.removeItem(SESSION_KEY);
  notify();
}

export function isSessionKeyEvent(event: StorageEvent) {
  return event.key === SESSION_KEY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || isSessionKeyEvent(event)) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSessionKey(): string | null {
  return useSyncExternalStore(subscribe, getSessionKey, () => null);
}
