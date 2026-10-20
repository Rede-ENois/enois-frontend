/**
 * Notificacoes push no celular (Web Push).
 *
 * O envio e do backend (VAPID); aqui so pedimos a permissao, inscrevemos o dispositivo e
 * registramos a inscricao no backend. Sem VAPID configurado no servidor, `pushApi.config()`
 * devolve `enabled: false` e a opcao nem aparece.
 *
 * iOS: so funciona no PWA instalado (16.4+). No navegador do iOS, `PushManager` existe mas
 * assinar falha — por isso o erro e tratado e mostrado ao usuario.
 */
import type { EnablePushResult } from "@/types/application/push/enable-push-result";
import type { PushState } from "@/types/application/push/push-state";

import { pushApi } from "@/lib/api/push";

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined"
  );
}

export function pushPermission(): PushState {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission as PushState;
}

/** VAPID publica (base64url) -> Uint8Array, no formato que o PushManager espera. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function readyRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

/** Pede permissao e registra este dispositivo para receber push. */
export async function enablePush(): Promise<EnablePushResult> {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  let config: { enabled: boolean; publicKey: string | null };
  try {
    config = await pushApi.config();
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  if (!config.enabled || !config.publicKey) {
    return { ok: false, reason: "server-disabled" };
  }

  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "permission-error" };
  }

  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  try {
    const registration = await readyRegistration();
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey) as BufferSource,
      }));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: "bad-subscription" };
    }

    await pushApi.subscribe({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "subscribe-failed" };
  }
}

/** Desliga o push neste dispositivo (remove a inscricao aqui e no backend). */
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  try {
    await pushApi.unsubscribe(subscription.endpoint);
  } catch {
    // Mesmo que o backend falhe, desinscrevemos localmente para o usuario nao continuar recebendo.
  }
  await subscription.unsubscribe();
}

export async function isPushActive(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  return Boolean(subscription);
}
