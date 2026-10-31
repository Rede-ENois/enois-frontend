import { texts } from "@/texts";
import type { AuthUser } from "@/types/application/auth/auth-user";

import { ApiError } from "./api-client";

export const ONBOARDING_PATH = "/boas-vindas";

/** Marks the onboarding as shown in this tab, so leaving it never traps the person. Written by the onboarding screen when it mounts, not before navigating: a lost navigation must not count as shown. */
const SHOWN_KEY = "onboarding-shown";

function readShown(): boolean {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingShown(): void {
  try {
    sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {
    // Sem sessionStorage (aba privada restrita): o pior caso é oferecer de novo no próximo /feed.
  }
}

function needsOnboarding(user: Pick<AuthUser, "onboardingCompleted"> | null | undefined): boolean {
  // Só `false` explícito: backend antigo (campo ausente) nunca desvia ninguém do feed.
  return user?.onboardingCompleted === false;
}

/**
 * Para onde vai quem acabou de entrar (login, e-mail confirmado, retorno do OAuth): o onboarding
 * uma vez por sessão para quem ainda não o fez, senão o feed. The screen itself marks it as shown.
 */
export function landingPathFor(
  user: Pick<AuthUser, "onboardingCompleted"> | null | undefined,
): "/feed" | typeof ONBOARDING_PATH {
  return needsOnboarding(user) && !readShown() ? ONBOARDING_PATH : "/feed";
}

/** O usuário gravado no login (`current_user`), que já traz o `onboardingCompleted`. */
export function landingPathForStoredUser(): "/feed" | typeof ONBOARDING_PATH {
  try {
    const raw = localStorage.getItem("current_user");
    return landingPathFor(raw ? (JSON.parse(raw) as AuthUser) : null);
  } catch {
    return "/feed";
  }
}

/**
 * Guarda central: quem abre o `/feed` (deep link, aba restaurada, outro aparelho) sem ter feito o
 * onboarding é levado a ele uma única vez por sessão. Depois de oferecido, o feed abre normal.
 */
export function shouldRedirectToOnboarding(
  pathname: string,
  user: Pick<AuthUser, "onboardingCompleted"> | null | undefined,
): boolean {
  return pathname === "/feed" && needsOnboarding(user) && !readShown();
}

/** Mensagem de tela para a falha de concluir ou pular (os textos do backend vêm sem acento). */
export function onboardingErrorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : undefined;
  const known = code ? texts.onboarding.errors[code as keyof typeof texts.onboarding.errors] : null;
  if (known) return known;
  if (code?.startsWith("TOO_MANY_")) return texts.onboarding.errors.TOO_MANY_ITEMS;
  return texts.onboarding.errors.generic;
}
