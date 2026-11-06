import type { AuthUser } from "@/types/application/auth/auth-user";
import type { Personalization } from "@/types/application/preferences/personalization";

/**
 * O resumo abre no feed, para quem já passou pelo onboarding, uma vez por versão publicada.
 *
 * A conta é a fonte de verdade: a dispensa vale em qualquer aparelho ou navegador. Enquanto a
 * leitura da conta não chega, o popup espera em vez de abrir e reaparecer depois.
 */
export function shouldShowWhatsNew(
  pathname: string,
  user: Pick<AuthUser, "onboardingCompleted"> | null | undefined,
  version: string | null | undefined,
  personalization: Pick<Personalization, "whatsNewEnabled" | "whatsNewLastSeen"> | null | undefined,
): boolean {
  if (pathname !== "/feed" || !user || user.onboardingCompleted === false || !version) return false;
  if (!personalization) return false;
  if (!personalization.whatsNewEnabled) return false;
  return personalization.whatsNewLastSeen !== version;
}
