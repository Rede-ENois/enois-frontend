import { clearAuthSession } from "./auth-session/clear-auth-session";
import { getRefreshToken } from "./auth-session/get-refresh-token";
import { persistAuthTokens } from "./auth-session/persist-auth-tokens";
import { getApiBaseUrl } from "./get-api-base-url";

export async function refreshAuthSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthSession();
      return false;
    }

    const data = await response.json();
    persistAuthTokens(data?.body ?? data);
    return true;
  } catch {
    return false;
  }
}
