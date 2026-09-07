import type { StatusResponse } from "@/types/application/api/status-response";
import type { AuthResponse } from "@/types/application/auth/auth-response";
import type { AuthUser } from "@/types/application/auth/auth-user";
import type { LoginInput } from "@/types/application/auth/login-input";
import type { OAuthStartResponse } from "@/types/application/auth/oauth-start-response";
import type { SignupInput } from "@/types/application/auth/signup-input";

import { apiRequest } from "../api-request";

export const authApi = {
  signup: (data: SignupInput) => apiRequest<AuthResponse>("POST", "/auth/signup", data, { idempotent: true }),
  login: (data: LoginInput) => apiRequest<AuthResponse>("POST", "/auth/login", data, { idempotent: true }),
  refresh: (refreshToken: string) => apiRequest<AuthResponse>("POST", "/auth/refresh", { refreshToken }, { idempotent: true }),
  logout: () => apiRequest<void>("POST", "/auth/logout", undefined, { idempotent: true }),
  me: () => apiRequest<AuthUser>("GET", "/auth/me"),
  forgotPassword: (email: string) => apiRequest<StatusResponse>("POST", "/auth/password/forgot", { email }, { idempotent: true }),
  resetPassword: (token: string, password: string) => apiRequest<StatusResponse>("POST", "/auth/password/reset", { token, password }, { idempotent: true }),
  oauthStart: (provider: OAuthStartResponse["provider"]) => apiRequest<OAuthStartResponse>("GET", `/auth/oauth/${provider.toLowerCase()}/start`),
  oauthCallback: (provider: string, code: string, state: string) => apiRequest<AuthResponse>("GET", `/auth/oauth/${provider}/callback${new URLSearchParams({ code, state }).toString()}`),
};
