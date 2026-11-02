import type { ServerEntry } from "@/types/server/server-entry";

import { CSP_NONCE_HEADER, contentSecurityPolicy, createCspNonce } from "./lib/csp";
import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Security headers on every SSR response. The CSP lives in `lib/csp.ts` (per-request nonce).
 * COOP isolates the window from cross-origin openers/popups; CORP keeps other sites from
 * embedding our responses.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "geolocation=(), microphone=(), camera=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-site",
};

/** Pages whose URL carries a secret (OAuth `code`/`state`, reset or email-confirmation token). */
const NO_REFERRER_PATHS = ["/auth/callback", "/auth/reset", "/auth/verify"];

/**
 * Quantas vezes cada resposta pode ser reaproveitada sem perguntar ao servidor.
 *
 * O HTML da aplicação nunca: ele traz um nonce de CSP de uso único e é a porta do app — servir um
 * HTML guardado é servir um bundle de um deploy anterior. O service worker precisa ser conferido a
 * cada abertura (`no-cache`), senão a correção demora um deploy inteiro para chegar. O resto do
 * caminho (bundle com hash, favicon) já é versionado pelo nome do arquivo e pode ficar em cache
 * longo — quem responde por esses arquivos é o servidor de estáticos, não este handler.
 */
function cacheControlFor(pathname: string, contentType: string): string | null {
  if (contentType.includes("text/html")) return "no-store";
  if (pathname === "/sw.js" || pathname === "/service-worker.js") return "no-cache";
  return null;
}

export function withSecurityHeaders(
  response: Response,
  request: Request,
  nonce: string | null,
): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  if (!headers.has("content-security-policy")) {
    headers.set("content-security-policy", contentSecurityPolicy(nonce));
  }
  const { pathname } = new URL(request.url);
  if (NO_REFERRER_PATHS.includes(pathname)) {
    headers.set("referrer-policy", "no-referrer");
  }
  // A rota que já definiu a política (robots/sitemap humanos com um dia) manda; o resto ganha aqui.
  if (!headers.has("cache-control")) {
    const policy = cacheControlFor(pathname, headers.get("content-type") ?? "");
    if (policy) headers.set("cache-control", policy);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Dev serves Vite's inline, un-nonced HMR preamble: no nonce there (CSP falls back).
    const nonce = import.meta.env.DEV ? null : createCspNonce();
    // Set in place (the runtime's request object cannot be re-wrapped); always overwritten, so a
    // client-sent value never survives.
    if (nonce) request.headers.set(CSP_NONCE_HEADER, nonce);
    else request.headers.delete(CSP_NONCE_HEADER);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response), request, nonce);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        request,
        nonce,
      );
    }
  },
};
