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

export function renewSessionKey() {
  const id = randomUUID();
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
