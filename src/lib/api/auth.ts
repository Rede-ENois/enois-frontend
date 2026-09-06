import { api } from "../api-client";

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  headline: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  user: AuthUser;
}

export interface OAuthStartResponse {
  provider: "GOOGLE" | "APPLE";
  state: string;
  authorizationUrl: string;
}

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

  startOAuth: (provider: "GOOGLE" | "APPLE") =>
    api.get<OAuthStartResponse>(`/auth/oauth/${provider.toLowerCase()}/start`),

  completeOAuth: (provider: string, code: string, state: string) =>
    api.get<AuthResponse>(
      `/auth/oauth/${provider}/callback${new URLSearchParams({ code, state }).toString()}`,
    ),
};
