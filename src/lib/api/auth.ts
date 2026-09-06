import type { AuthResponse, AuthUser } from "@/types/application/auth/auth-response";
import type { OAuthProvider, OAuthStartResponse } from "@/types/application/auth/oauth-start-response";
import type { SignInInput, SignUpInput } from "@/types/application/auth/sign-in-input";

import { api } from "../api-client";

export type { AuthResponse, AuthUser } from "@/types/application/auth/auth-response";
export type { OAuthProvider, OAuthStartResponse } from "@/types/application/auth/oauth-start-response";
export type { SignInInput, SignUpInput } from "@/types/application/auth/sign-in-input";

export const authApi = {
  signUp: (input: SignUpInput) => api.post<AuthResponse>("/auth/signup", input),

  signIn: (input: SignInInput) => api.post<AuthResponse>("/auth/login", input),

  refreshSession: (refreshToken: string) =>
    api.post<AuthResponse>("/auth/refresh", { refreshToken }),

  signOut: () => api.post<void>("/auth/logout"),

  getCurrentUser: () => api.get<AuthUser>("/auth/me"),

  requestPasswordReset: (email: string) =>
    api.post<{ status: string }>("/auth/password/forgot", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ status: string }>("/auth/password/reset", { token, password }),

  startOAuth: (provider: OAuthProvider) =>
    api.get<OAuthStartResponse>(`/auth/oauth/${provider.toLowerCase()}/start`),

  completeOAuth: (provider: string, code: string, state: string) =>
    api.get<AuthResponse>(
      `/auth/oauth/${provider}/callback${new URLSearchParams({ code, state }).toString()}`,
    ),
};
