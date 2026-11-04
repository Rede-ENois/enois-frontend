import { texts } from "@/texts";
import { HttpStatus } from "@/types/application/api/http-status";
import type { RefreshOutcome } from "@/types/application/api/refresh-outcome";
import type { RequestOptions } from "@/types/application/api/request-options";

import { notifyBirthDateRequired, notifyParentalConsentRequired } from "./age-required";
import { clientOriginHeader } from "./api/client-origin";
import { clearAuthHint } from "./auth-hint";
import { getDeviceId } from "./device-id";
import { resetSessionScopedData } from "./query-client";
import { dropLegacyTokens, hasSessionFlag, legacyRefreshToken, storeSession } from "./session";
import { SESSION_FLAG_KEY, dropSessionKey } from "./session-key";

/**
 * Base da API.
 *
 * Em producao a API mora em OUTRO host (`https://api.enois.ia.br/api`, ver `ARG VITE_API_BACKEND`
 * no Dockerfile) — o host do front nao expoe `/api`. No dev o padrao e RELATIVO (`/api`) e o proxy
 * do Vite encaminha para o backend (ver `BACKEND_TARGET` no vite.config.ts). O fallback antigo era
 * `http://localhost:8081/api`, e quando um build saiu sem a variavel (Dockerfile sem ARG) a imagem
 * publicada passou a chamar localhost DENTRO do navegador de quem usava — o app ficou vazio e o
 * login dizia "nao foi possivel conectar ao servidor".
 */
const API_BACKEND = import.meta.env.VITE_API_BACKEND ?? "/api";

function baseUrl(): string {
  if (typeof window === "undefined") return serverBaseUrl();
  if (import.meta.env.DEV) return "/api";
  return API_BACKEND;
}

/**
 * Base for SSR loaders. The server has no Vite proxy, so a relative `/api` never resolves there: in
 * dev every loader failed and a deep link like `/perfil/x` rendered "Pessoa não encontrada". With a
 * relative base, the server calls the same backend the dev proxy targets (`BACKEND_TARGET`, set by
 * `vite.config.ts`); an absolute `VITE_API_BACKEND` (production builds) is used as is.
 */
function serverBaseUrl(): string {
  const target = typeof process === "undefined" ? undefined : process.env.BACKEND_TARGET;
  return API_BACKEND.startsWith("/") && target ? `${target}${API_BACKEND}` : API_BACKEND;
}

/**
 * URL absoluta de um caminho da API (SEM o prefixo `/api`).
 *
 * Serve para o que nao passa pelo cliente `api` (redirect do navegador, `fetch` de multipart): um
 * caminho relativo a `/api` assume que o host do front tambem serve a API, o que so vale em dev.
 * Era o que quebrava o login com LinkedIn — o navegador era mandado para `enois.ia.br/api/...` e
 * recebia o 404 do proprio front, sem nunca chegar no backend.
 */
export function apiUrl(path: string): string {
  return `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public path?: string,
    /** Segundos do header Retry-After (só em 429): o chamador decide se espera. */
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Headers every API call carries. The session travels in HttpOnly cookies (hence
 * `credentials: "include"` on every fetch); `X-CSRF-Protection` is the custom header the API
 * requires on cookie-authenticated writes: a cross-site form cannot set it, and a cross-origin
 * script needs a CORS preflight that only allowlisted origins pass.
 */
export function sessionHeaders(): Record<string, string> {
  // Toda requisição declara a origem do app; o backend recusa sem uma origem cadastrada.
  const headers: Record<string, string> = { ...clientOriginHeader(), "X-CSRF-Protection": "1" };
  // Identificador opaco do dispositivo (não é MAC): correlaciona requisições e uploads nos logs.
  const deviceId = getDeviceId();
  if (deviceId) headers["X-Device-Id"] = deviceId;
  return headers;
}

export function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Fingerprint leve do dispositivo: hash de sinais que bots em proxies distintos compartilham
 * (mesmo User-Agent, idioma, resolução). Não é biometria — é só o bastante para agrupar
 * cadastros do mesmo navegador atrás de IPs diferentes.
 */
function deviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const signals = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  let hash = 0;
  for (let i = 0; i < signals.length; i++) {
    hash = ((hash << 5) - hash + signals.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function idemKey(): Record<string, string> {
  return { "Idempotency-Key": randomUUID() };
}

/** Renova quando faltar menos que isso para expirar, em vez de esperar o 401. */
const REFRESH_WINDOW_MS = 5 * 60 * 1000;

/**
 * Espera máxima aceita para repetir uma escrita recusada por limite. Acima disso a espera é
 * pior do que devolver o aviso e deixar a pessoa tentar de novo.
 */
const MAX_RETRY_AFTER_SECONDS = 15;

/** Espera antes de repetir uma escrita que morreu sem resposta (janela do limitador da frente). */
const NETWORK_RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let refreshPromise: Promise<RefreshOutcome> | null = null;

/**
 * Ceiling for the session calls made while holding the cross-tab refresh lock: a stalled request
 * would otherwise block the refresh of every tab. A timeout counts as "unavailable".
 */
const SESSION_CALL_TIMEOUT_MS = 15_000;

function sessionCallSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(SESSION_CALL_TIMEOUT_MS)
    : undefined;
}

function sessionExpiresAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("session_expires_at");
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Renova a sessao uma unica vez, mesmo com varias chamadas concorrentes: todas aguardam a MESMA
 * promessa. Sem isso, cada 401 paralelo disparava um refresh proprio e rotacionava o token varias
 * vezes, derrubando a sessao.
 *
 * `expiryBefore` is the expiry the caller's credentials were sent with: a 401 for a request sent
 * before another refresh completed must compare against THAT, or it rotates the token again.
 */
function refreshSession(expiryBefore = sessionExpiresAt()): Promise<RefreshOutcome> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = withRefreshLock(() => {
    // Another tab renewed while this one waited for the lock: the shared cookies are already new,
    // and refreshing again would rotate the token a second time for nothing.
    const expiryNow = sessionExpiresAt();
    if (
      expiryNow !== null &&
      (expiryBefore === null || expiryNow > expiryBefore) &&
      expiryNow - Date.now() > REFRESH_WINDOW_MS
    ) {
      return Promise.resolve<RefreshOutcome>("renewed");
    }
    // While a pre-cookie refresh token is still stored, renewing means trading it for cookies.
    return doRefresh(legacyRefreshToken() ?? undefined);
  }).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * Renews the session now and stores its expiry. For entry points that receive the cookies without
 * an expiry in the body (OAuth return): without it the proactive refresh never runs.
 */
export function renewSession(): Promise<RefreshOutcome> {
  return refreshSession();
}

/**
 * One refresh at a time across every tab of the origin (Web Locks). Without locks support the
 * per-tab promise above still dedupes, and the /auth/me check covers a cross-tab rotation.
 */
async function withRefreshLock(task: () => Promise<RefreshOutcome>): Promise<RefreshOutcome> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return task();
  return await locks.request("enois-refresh", task);
}

/**
 * Renews through the `enois_refresh` cookie (no body). `legacyRefreshToken` is only for the one-time
 * move of a session that still had its tokens in localStorage: the API answers with the cookies.
 */
async function doRefresh(legacyToken?: string): Promise<RefreshOutcome> {
  try {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: legacyToken
        ? { "Content-Type": "application/json", ...sessionHeaders() }
        : sessionHeaders(),
      body: legacyToken ? JSON.stringify({ refreshToken: legacyToken }) : undefined,
      signal: sessionCallSignal(),
    });

    // So a recusa EXPLICITA (400/401/403) significa sessao encerrada — 400 e o refresh sem cookie
    // (cookies vencidos ou apagados). Um 429 do limitador ou um 502 durante o deploy sao falhas do
    // servidor, nao prova de que a sessao morreu — deslogar aqui era o que fazia a pessoa cair no
    // login "sem motivo".
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      // The API rotates the refresh token on every renewal and the cookie jar is shared by every
      // tab: another tab may have renewed while this call was in flight, so this 401 is only the
      // old token. Ending the session here would log BOTH tabs out; ask the API first.
      // Same for a legacy token: another tab may have traded it first (without Web Locks).
      const session = await sessionStillValid();
      if (session === "valid") {
        if (legacyToken) dropLegacyTokens();
        return "renewed";
      }
      // Could not tell (network/CORS, e.g. a limiter 429 without CORS headers): keep the session.
      if (session === "unknown") return "unavailable";
      clearSession();
      return "refused";
    }
    if (!response.ok) {
      return "unavailable";
    }

    const data = await response.json();
    const body = data?.body ?? data;
    if (legacyToken) dropLegacyTokens();
    storeSession({ expiresAt: body?.expiresAt, refreshExpiresAt: body?.refreshExpiresAt });
    return "renewed";
  } catch {
    // Falha de rede nao encerra a sessao: o token pode continuar valido. Quem decide e o 401.
    return "unavailable";
  }
}

async function sessionStillValid(): Promise<"valid" | "invalid" | "unknown"> {
  try {
    const response = await fetch(`${baseUrl()}/auth/me`, {
      credentials: "include",
      headers: sessionHeaders(),
      signal: sessionCallSignal(),
    });
    if (response.ok) return "valid";
    return response.status === 401 || response.status === 403 ? "invalid" : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Past the stored refresh expiry the refresh cookie is gone too: the session cannot come back, so
 * the "logged in" flag is dropped instead of leaving a shell that only fails.
 */
function dropExpiredSession(): void {
  if (typeof window === "undefined" || !hasSessionFlag()) return;
  const refreshExpiresAt = Date.parse(localStorage.getItem("refresh_expires_at") ?? "");
  if (!Number.isNaN(refreshExpiresAt) && refreshExpiresAt <= Date.now()) clearSession();
}

/** Havendo sessao perto de expirar, renova antes da requisicao (evita o 401 e a ida ao login). */
async function refreshIfNeeded(): Promise<void> {
  const expiresAt = sessionExpiresAt();
  if (expiresAt === null) return;
  if (expiresAt - Date.now() > REFRESH_WINDOW_MS) return;
  if (!hasSessionFlag()) return;
  await refreshSession();
}

// Voltar para a aba depois de um tempo era o gatilho do "logout": a proxima chamada vinha 401 e
// jogava a pessoa para o login. Ao ficar visivel, renova de forma transparente se estiver vencendo.
//
// No app instalado (PWA) o `visibilitychange` sozinho nao basta: retomar pelo icone, voltar da
// bfcache ou recuperar a rede nao disparam esse evento em varias plataformas (iOS principalmente),
// e a pessoa cai no login sem entender. `pageshow` e `online` fecham essa lacuna.
if (typeof window !== "undefined") {
  // One-time move off localStorage tokens: the old refresh token is traded for the cookies. The
  // person stays in the logged-in shell meanwhile (flag set now): a refusal clears flag and token,
  // a network/server failure keeps both, so the next refresh or load trades the token again. A
  // 401 meanwhile waits for this same in-flight refresh instead of ending the session.
  if (legacyRefreshToken()) {
    localStorage.setItem(SESSION_FLAG_KEY, "1");
    void refreshSession();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshIfNeeded();
    }
  });

  window.addEventListener("pageshow", () => {
    void refreshIfNeeded();
  });

  window.addEventListener("online", () => {
    void refreshIfNeeded();
  });
}

export function clearSession() {
  const hadSession = hasSessionFlag();
  localStorage.removeItem(SESSION_FLAG_KEY);
  dropLegacyTokens();
  localStorage.removeItem("session_expires_at");
  localStorage.removeItem("refresh_expires_at");
  localStorage.removeItem("current_user");
  clearAuthHint();
  dropSessionKey();
  if (hadSession) resetSessionScopedData();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  dropExpiredSession();
  // Renova proativamente antes de sair com um token que esta vencendo (as rotas de auth cuidam
  // da propria sessao e nao passam por aqui).
  if (!path.startsWith("/auth/")) {
    await refreshIfNeeded();
  }

  // FormData (multipart uploads/imports) goes as-is: the browser sets the boundary header.
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;
  const payload = multipart ? (body as FormData) : body ? JSON.stringify(body) : undefined;
  const headers: Record<string, string> = {
    ...(multipart ? {} : { "Content-Type": "application/json" }),
    ...sessionHeaders(),
  };
  const hadSession = hasSessionFlag();
  // Expiry the cookies had when this request left: decides later whether a 401 is already stale.
  const expiryAtSend = sessionExpiresAt();

  if (opts?.idempotent) {
    Object.assign(headers, idemKey());
  }
  if (opts?.fingerprint) {
    const fp = deviceFingerprint();
    if (fp) headers["X-Device-Fingerprint"] = fp;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      credentials: "include",
      headers,
      body: payload,
    });
    // Limite do proxy/CDN: a recusa vem sem CORS e o navegador a reporta como falha de rede.
    // Em escrita idempotente (todas as nossas), esperar o Retry-After e repetir uma vez é
    // melhor do que devolver "não foi possível" para quem só clicou duas vezes seguidas.
    if (response.status === HttpStatus.TOO_MANY_REQUESTS && opts?.idempotent) {
      const seconds = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
      if (Number.isFinite(seconds) && seconds > 0 && seconds <= MAX_RETRY_AFTER_SECONDS) {
        await sleep(seconds * 1000);
        response = await fetch(`${baseUrl()}${path}`, {
          method,
          credentials: "include",
          headers,
          body: payload,
        });
      }
    }
  } catch (firstFailure) {
    // Falha de rede numa escrita idempotente: pode ser o limitador da frente recusando o
    // preflight (o navegador esconde a resposta e reporta "fetch failed"). Espera a janela
    // virar e tenta uma vez; se continuar falhando, o erro sobe.
    if (opts?.idempotent) {
      try {
        await sleep(NETWORK_RETRY_DELAY_MS);
        response = await fetch(`${baseUrl()}${path}`, {
          method,
          credentials: "include",
          headers,
          body: payload,
        });
      } catch {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está no ar.",
          path,
        );
      }
    } else {
      throw new ApiError(
        0,
        "NETWORK_ERROR",
        "Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está no ar.",
        path,
      );
    }
    void firstFailure;
  }

  // 401 e sessao invalida/expirada (tenta refresh e, se nao der, manda para o login). 403 e
  // PERMISSAO negada, nao sessao: derrubar o usuario aqui era um erro (quem tem conta pendente de
  // verificacao, por exemplo, era desconectado em vez de ler o aviso).
  if (response.status === HttpStatus.UNAUTHORIZED && hadSession && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession(expiryAtSend);

    if (refreshed === "unavailable") {
      // Servidor instavel (429/5xx/rede). NAO encerra a sessao: a proxima tentativa pode dar certo
      // e o token continua no storage. Antes, qualquer falha aqui virava logout na hora.
      throw new ApiError(
        0,
        "SESSION_CHECK_UNAVAILABLE",
        "Não foi possível confirmar sua sessão agora. Tente de novo em instantes.",
        path,
      );
    }

    if (refreshed === "renewed") {
      try {
        response = await fetch(`${baseUrl()}${path}`, {
          method,
          credentials: "include",
          headers,
          body: payload,
        });
      } catch {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está no ar.",
          path,
        );
      }

      // A renovação funcionou e a operação foi repetida.
      //  - 2xx/204: deu certo; segue o fluxo normal (era aqui que a resposta boa virava erro).
      //  - 401: o token novo também foi rejeitado — a sessão acabou de fato, cai para o
      //    clearSession() abaixo.
      //  - qualquer outro status (403, 429, 5xx): a sessão É válida; o erro é da operação e
      //    deve chegar à tela sem deslogar quem está usando (#183).
      if (response.ok) {
        return parseBody<T>(response);
      }
      if (response.status !== HttpStatus.UNAUTHORIZED) {
        // A sessão está boa; o erro é da operação. Passa pelo mesmo tratamento do fluxo comum
        // (data de nascimento, consentimento parental, Retry-After), sem deslogar ninguém.
        return fail<T>(response, path, hadSession);
      }
    }

    // Só chega aqui quando:
    //  • refreshSession retornou "refused" (401/403 no /auth/refresh → token morto), ou
    //  • o retry após renovação também veio 401 (token novo rejeitado).
    // Em ambos os casos a sessão acabou de verdade: limpa, manda para o login e responde com o
    // código próprio (o corpo do 401 da operação não descreve o que houve com a sessão).
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/entrar?tab=login";
    }
    throw new ApiError(
      HttpStatus.UNAUTHORIZED,
      "SESSION_EXPIRED",
      "Sessão expirada. Faça login novamente.",
      path,
    );
  }

  // Sem sessao nao redireciona daqui (ha consultas autenticadas em telas publicas, como "posts
  // salvos" num post compartilhado): quem barra o acesso e o guard de rota.
  //
  // O que o backend respondeu vem SEMPRE primeiro: era isso que fazia senha errada no login exibir
  // "É necessário entrar para ver isso" — a resposta de 401 ja dizia "Email ou senha invalidos".
  if (!response.ok) {
    return fail<T>(response, path, hadSession);
  }

  return parseBody<T>(response);
}

/**
 * Resposta de erro: mensagem do backend sempre em primeiro lugar e os efeitos colaterais que
 * dependem do código (data de nascimento, consentimento parental). Nunca retorna.
 */
async function fail<T>(response: Response, path: string, hadSession: boolean): Promise<T> {
  const errorBody = await response.json().catch(() => null);
  const retryAfter = response.headers.get("Retry-After") ?? response.headers.get("retry-after");
  if (
    !errorBody?.code &&
    !errorBody?.message &&
    (response.status === HttpStatus.UNAUTHORIZED || response.status === HttpStatus.FORBIDDEN) &&
    !hadSession
  ) {
    throw new ApiError(
      response.status,
      "UNAUTHENTICATED",
      "É necessário entrar para ver isso.",
      path,
    );
  }
  // Escrever (postar, comentar, mensagem) exige a data de nascimento declarada: em vez de só
  // mostrar o erro, o app abre o diálogo de regularização em qualquer tela.
  if (errorBody?.code === "BIRTH_DATE_REQUIRED") {
    notifyBirthDateRequired();
  }
  // Menor sem autorizacao do responsavel: abre a tela de supervisao em qualquer acao bloqueada.
  if (errorBody?.code === "PARENTAL_CONSENT_REQUIRED") {
    notifyParentalConsentRequired();
  }
  throw new ApiError(
    response.status,
    errorBody?.code,
    texts.errors.apiMessages[errorBody?.code] ?? errorBody?.message ?? response.statusText,
    path,
    retryAfter ? Number.parseInt(retryAfter, 10) || undefined : undefined,
  );
}

/**
 * Corpo padrão das respostas bem-sucedidas (envelope `{body}`, JSON direto ou vazio).
 *
 * Vazio nunca é JSON válido: ler o corpo em vez de confiar no `Content-Length` evita o
 * `response.json()` que estourava com "Unexpected end of JSON input" — e um 200 sem corpo
 * passa a ser o `undefined` que as rotas sem retorno já esperam.
 */
async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === HttpStatus.NO_CONTENT) {
    return undefined as T;
  }
  const raw = await response.text();
  if (!raw.trim()) return undefined as T;
  const data = JSON.parse(raw);
  if (data?.body !== undefined) return data.body as T;
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, { idempotent: true, ...opts }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body, { idempotent: true }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body, { idempotent: true }),
  delete: <T>(path: string) => request<T>("DELETE", path, null, { idempotent: true }),
};

export function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      search.append(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
