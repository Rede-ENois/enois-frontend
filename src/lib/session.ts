import type { SessionPayload } from "@/types/application/auth/session-payload";

/**
 * Guarda a sessão no mesmo formato em todo lugar (login, cadastro confirmado e retorno do OAuth).
 *
 * O `current_user` é o que faz o cabeçalho mostrar nome e foto antes do /auth/me responder — quem
 * entrava pelo provedor não gravava esse campo e via o perfil genérico.
 */
export function storeSession({
  token,
  refreshToken,
  expiresAt,
  refreshExpiresAt,
  user,
}: SessionPayload) {
  localStorage.setItem("session_token", token);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  if (expiresAt) localStorage.setItem("session_expires_at", expiresAt);
  if (refreshExpiresAt) localStorage.setItem("refresh_expires_at", refreshExpiresAt);
  if (user) localStorage.setItem("current_user", JSON.stringify(user));
}
