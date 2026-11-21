import { clearSanctionAccess, markSanctionAccess } from "@/stores/sanction-access.store";
import type { OAuthLoginResult } from "@/types/application/auth/oauth-login-result";

import { ApiError, apiUrl, clearSession, renewSession } from "./api-client";
import { authApi } from "./api/auth";
import { storeSession } from "./session";

/** Providers the API registers a callback for; anything else never reaches the API path. */
const OAUTH_PROVIDERS = new Set(["google", "linkedin", "apple"]);

/**
 * API URL that finishes a provider login whose redirect_uri points at this page (LinkedIn), or
 * null when the provider is not one we know.
 */
export function oauthCallbackUrl(provider: string, code: string, state: string): string | null {
  const normalized = provider.toLowerCase();
  if (!OAUTH_PROVIDERS.has(normalized)) return null;
  const params = new URLSearchParams({ code, state });
  return apiUrl(`/auth/oauth/${normalized}/callback?${params.toString()}`);
}

/**
 * Completes the OAuth return: the redirect set the session cookies (no token in the URL).
 * /auth/me confirms the session and fills the header with name and photo; one refresh records the
 * expiry the redirect does not carry. Returns the user (the page picks the landing from it), or null
 * when the session did not hold (me failed or the refresh was refused), so the page shows the
 * login error instead of entering the app.
 */
export async function finishOAuthLogin(): Promise<OAuthLoginResult> {
  try {
    const user = await authApi.me();
    clearSession();
    clearSanctionAccess();
    storeSession({ user });
    return (await renewSession()) !== "refused" ? user : null;
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 403 &&
      ["ACCOUNT_SUSPENDED", "SESSION_RESTRICTED"].includes(error.code ?? "")
    ) {
      clearSession();
      markSanctionAccess();
      return { accessScope: "SANCTIONS_ONLY" };
    }
    if (error instanceof ApiError && [400, 401, 403].includes(error.status)) {
      clearSession();
    }
    return null;
  }
}
