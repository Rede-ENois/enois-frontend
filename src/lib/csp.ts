import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { trustedCallOrigins } from "./calls/call-origins";

/**
 * Internal request header that carries the per-request CSP nonce from the server entry
 * (`server.ts`, which also writes the CSP header) to the router, which stamps it on every inline
 * script it renders. The server entry always overwrites it, so a client cannot choose the nonce.
 */
export const CSP_NONCE_HEADER = "x-enois-csp-nonce";

/**
 * The page CSP. Inline scripts run only with the request's nonce: an injected `<script>` or
 * inline handler does not. Without a nonce (Vite dev server, whose HMR preamble is inline and
 * un-nonced) it falls back to 'unsafe-inline'.
 *
 * Styles keep 'unsafe-inline' (Tailwind/style attributes), media and frames stay https: (CDN,
 * third-party game iframes), frame-ancestors 'none' blocks clickjacking.
 */
export function contentSecurityPolicy(nonce: string | null): string {
  const inlineScripts = nonce ? `'nonce-${nonce}'` : "'unsafe-inline'";
  return [
    "default-src 'self'",
    `script-src 'self' ${inlineScripts} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https: wss: https://challenges.cloudflare.com",
    "frame-src https:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Permissions-Policy da página.
 *
 * Antes ela era `microphone=(), camera=()`: isso fecha as duas para a página inteira, e o
 * `allow` do iframe não reabre o que a página negou. A sala carregava sem áudio nem vídeo e o
 * navegador não chegava a perguntar nada — nem no computador, nem no celular. Agora a própria
 * página pode usar as duas (é ela que pede a permissão ao usuário antes de abrir a sala) e só o
 * servidor de reunião hospedado por nós entra no `allow`, que é o mesmo que vai no iframe. Um
 * endereço de reunião de outro domínio não ganha a câmera. O resto continua fechado.
 *
 * A origem vai entre aspas porque a gramática da política exige: sem elas o navegador descarta o
 * item e a lista fica só com `self` — a sala abre e a mídia continua bloqueada, mesmo com a
 * permissão liberada no navegador. `self` é palavra-chave e não se cita.
 */
export function permissionsPolicy(origins: string[] = trustedCallOrigins()): string {
  const callHosts = origins
    .map((origin) => origin.replace(/\/$/, ""))
    .filter(Boolean)
    .map((origin) => `"${origin}"`)
    .join(" ");
  const media = callHosts ? `self ${callHosts}` : "self";
  return [
    "geolocation=()",
    `microphone=(${media})`,
    `camera=(${media})`,
    `display-capture=(${media})`,
    "payment=()",
    "usb=()",
  ].join(", ");
}

/** 128 random bits, base64. */
export function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/** The nonce of the request being rendered (server only; the client reads it from the page). */
export const readCspNonce = createIsomorphicFn()
  .server(() => getRequestHeader(CSP_NONCE_HEADER) || undefined)
  .client((): string | undefined => undefined);
