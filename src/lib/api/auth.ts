import type { StatusResponse } from "@/types/application/api/status-response";
import type { AuthResponse } from "@/types/application/auth/auth-response";
import type { AuthUser } from "@/types/application/auth/auth-user";
import type { ChangeEmailInput } from "@/types/application/auth/change-email-input";
import type { ChangePasswordInput } from "@/types/application/auth/change-password-input";
import type { DeleteAccountInput } from "@/types/application/auth/delete-account-input";
import type { LinkedProvider } from "@/types/application/auth/linked-provider";
import type { LoginInput } from "@/types/application/auth/login-input";
import type { OAuthMode } from "@/types/application/auth/oauth-mode";
import type { OAuthStartResponse } from "@/types/application/auth/oauth-start-response";
import type { SignupInput } from "@/types/application/auth/signup-input";
import type { SignupResult } from "@/types/application/auth/signup-result";
import type { TotpSetup } from "@/types/application/auth/totp-setup";
import type { TwoFactorChallenge } from "@/types/application/auth/two-factor-challenge";
import type { TwoFactorEnableResult } from "@/types/application/auth/two-factor-enable-result";
import type { TwoFactorStatus } from "@/types/application/auth/two-factor-status";

import { api } from "../api-client";

export const authApi = {
  /** Cria a conta pendente de confirmação e envia o link para o e-mail. */
  signup: (data: SignupInput) => api.post<SignupResult>("/auth/signup", data),

  /** Confirma o e-mail pelo token do link e já devolve a sessão. */
  verifyEmail: (token: string) => api.post<AuthResponse>("/auth/email/verify", { token }),

  /** Reenvia o link de confirmação (sempre 202, sem revelar se o e-mail existe). */
  resendVerification: (email: string) => api.post<StatusResponse>("/auth/email/resend", { email }),

  /**
   * Login por senha. Responde com a sessão ou, quando a conta tem segundo fator, com o desafio
   * (`twoFactorRequired`) — a sessão só sai em `verifyTwoFactor`.
   */
  login: (data: LoginInput) => api.post<AuthResponse | TwoFactorChallenge>("/auth/login", data),

  /** Conclui o login com o código do segundo fator (ou um código de recuperação). */
  verifyTwoFactor: (challengeId: string, code: string) =>
    api.post<AuthResponse>("/auth/2fa/verify", { challengeId, code }),

  /** Reenvia o código por e-mail do desafio em andamento. */
  resendTwoFactor: (challengeId: string) =>
    api.post<StatusResponse>("/auth/2fa/resend", { challengeId }),

  /** Estado do segundo fator e da verificação da conta. */
  twoFactorStatus: () => api.get<TwoFactorStatus>("/auth/2fa/status"),

  /** Inicia a configuração do aplicativo authenticator. */
  startTotpSetup: () => api.post<TotpSetup>("/auth/2fa/totp/setup"),

  /** Confirma o código do app e devolve os códigos de recuperação. */
  enableTotp: (code: string) => api.post<TwoFactorEnableResult>("/auth/2fa/totp/enable", { code }),

  disableTotp: (password: string) =>
    api.post<StatusResponse>("/auth/2fa/totp/disable", { password }),

  /** Envia o código que confirma a ativação do segundo fator por e-mail. */
  requestEmailOtp: () => api.post<StatusResponse>("/auth/2fa/email/request"),

  confirmEmailOtp: (code: string) => api.post<StatusResponse>("/auth/2fa/email/confirm", { code }),

  disableEmailOtp: (password: string) =>
    api.post<StatusResponse>("/auth/2fa/email/disable", { password }),

  refresh: (refreshToken: string) => api.post<AuthResponse>("/auth/refresh", { refreshToken }),

  logout: () => api.post<void>("/auth/logout"),

  me: () => api.get<AuthUser>("/auth/me"),

  changeEmail: (data: ChangeEmailInput) => api.post<StatusResponse>("/auth/email/change", data),

  changePassword: (data: ChangePasswordInput) =>
    api.post<StatusResponse>("/auth/password/change", data),

  deleteAccount: (data: DeleteAccountInput) =>
    api.post<StatusResponse>("/auth/account/delete", data),

  forgotPassword: (email: string) => api.post<StatusResponse>("/auth/password/forgot", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<StatusResponse>("/auth/password/reset", { token, password }),

  /** `mode` diz ao backend se a pessoa está entrando ou criando conta (ver OAuthMode). */
  oauthStart: (provider: OAuthStartResponse["provider"], mode: OAuthMode = "login") =>
    api.get<OAuthStartResponse>(`/auth/oauth/${provider.toLowerCase()}/start?mode=${mode}`),

  /** Provedores vinculados à conta (para vincular/desvincular). */
  oauthProviders: () => api.get<LinkedProvider[]>("/auth/oauth/providers"),

  /** Inicia a vinculação do provedor à conta logada (o callback conclui). */
  oauthLinkStart: (provider: OAuthStartResponse["provider"]) =>
    api.post<OAuthStartResponse>(`/auth/oauth/${provider.toLowerCase()}/link`),

  oauthUnlink: (provider: string) =>
    api.delete<StatusResponse>(`/auth/oauth/${provider.toLowerCase()}/link`),
};
