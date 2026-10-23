import { HttpStatus } from "@/types/application/api/http-status";
import type { RefreshOutcome } from "@/types/application/api/refresh-outcome";
import type { RequestOptions } from "@/types/application/api/request-options";

import { notifyBirthDateRequired, notifyParentalConsentRequired } from "./age-required";
import { clientOriginHeader } from "./api/client-origin";
import { clearAuthHint } from "./auth-hint";
import { getDeviceId } from "./device-id";
import { resetSessionScopedData } from "./query-client";
import { dropSessionKey } from "./session-key";

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
  if (typeof window === "undefined") return API_BACKEND;
  if (import.meta.env.DEV) return "/api";
  return API_BACKEND;
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
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("session_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  // Toda requisição declara a origem do app; o backend recusa sem uma origem cadastrada.
  const headers: Record<string, string> = { ...clientOriginHeader() };
  if (token) headers["X-Session-Token"] = token;
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

let refreshPromise: Promise<RefreshOutcome> | null = null;

function refreshTokenValue(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
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
 */
function refreshSession(): Promise<RefreshOutcome> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefresh(): Promise<RefreshOutcome> {
  const token = refreshTokenValue();
  if (!token) return "refused";

  try {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientOriginHeader() },
      body: JSON.stringify({ refreshToken: token }),
    });

    // So a recusa EXPLICITA (401/403) significa sessao encerrada. Um 429 do limitador ou um 502
    // durante o deploy sao falhas do servidor, nao prova de que a sessao morreu — deslogar aqui
    // era o que fazia a pessoa cair no login "sem motivo".
    if (response.status === HttpStatus.UNAUTHORIZED || response.status === HttpStatus.FORBIDDEN) {
      clearSession();
      return "refused";
    }
    if (!response.ok) {
      return "unavailable";
    }

    const data = await response.json();
    const body = data?.body ?? data;
    localStorage.setItem("session_token", body.token);
    localStorage.setItem("refresh_token", body.refreshToken);
    localStorage.setItem("session_expires_at", body.expiresAt);
    localStorage.setItem("refresh_expires_at", body.refreshExpiresAt);
    return "renewed";
  } catch {
    // Falha de rede nao encerra a sessao: o token pode continuar valido. Quem decide e o 401.
    return "unavailable";
  }
}

/** Havendo sessao perto de expirar, renova antes da requisicao (evita o 401 e a ida ao login). */
async function refreshIfNeeded(): Promise<void> {
  const expiresAt = sessionExpiresAt();
  if (expiresAt === null) return;
  if (expiresAt - Date.now() > REFRESH_WINDOW_MS) return;
  if (!refreshTokenValue()) return;
  await refreshSession();
}

// Voltar para a aba depois de um tempo era o gatilho do "logout": a proxima chamada vinha 401 e
// jogava a pessoa para o login. Ao ficar visivel, renova de forma transparente se estiver vencendo.
//
// No app instalado (PWA) o `visibilitychange` sozinho nao basta: retomar pelo icone, voltar da
// bfcache ou recuperar a rede nao disparam esse evento em varias plataformas (iOS principalmente),
// e a pessoa cai no login sem entender. `pageshow` e `online` fecham essa lacuna.
if (typeof window !== "undefined") {
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
  const hadSession = localStorage.getItem("session_token") !== null;
  localStorage.removeItem("session_token");
  localStorage.removeItem("refresh_token");
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
  // Renova proativamente antes de sair com um token que esta vencendo (as rotas de auth cuidam
  // da propria sessao e nao passam por aqui).
  if (!path.startsWith("/auth/")) {
    await refreshIfNeeded();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

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
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está no ar.",
      path,
    );
  }

  const hadSession = Boolean(headers["X-Session-Token"]);
  // 401 e sessao invalida/expirada (tenta refresh e, se nao der, manda para o login). 403 e
  // PERMISSAO negada, nao sessao: derrubar o usuario aqui era um erro (quem tem conta pendente de
  // verificacao, por exemplo, era desconectado em vez de ler o aviso).
  if (response.status === HttpStatus.UNAUTHORIZED && hadSession && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();

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
      headers["X-Session-Token"] = getToken() ?? "";
      response = await fetch(`${baseUrl()}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }

    // Uma falha da operação após renovar não significa que a sessão foi recusada.
    if (refreshed === "refused" || response.status === HttpStatus.UNAUTHORIZED) {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/entrar?tab=login";
      }
      throw new ApiError(
        response.status,
        "SESSION_EXPIRED",
        "Sessão expirada. Faça login novamente.",
        path,
      );
    }
  }

  // Sem sessao nao redireciona daqui (ha consultas autenticadas em telas publicas, como "posts
  // salvos" num post compartilhado): quem barra o acesso e o guard de rota.
  //
  // O que o backend respondeu vem SEMPRE primeiro: era isso que fazia senha errada no login exibir
  // "É necessário entrar para ver isso" — a resposta de 401 ja dizia "Email ou senha invalidos".
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
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
      errorBody?.message ?? response.statusText,
      path,
    );
  }

  if (response.status === HttpStatus.NO_CONTENT || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const data = await response.json();

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

export { getToken as getSessionToken };
