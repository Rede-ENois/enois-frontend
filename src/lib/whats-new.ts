import type { AuthUser } from "@/types/application/auth/auth-user";

/** Version (the release `updatedAt`) of the last release the person closed, per browser. */
const SEEN_KEY = "whats-new-seen";

/** `undefined` when there is no storage (restricted private tab): nothing can be remembered. */
function lastSeen(): string | null | undefined {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return undefined;
  }
}

export function markWhatsNewSeen(version: string): void {
  try {
    localStorage.setItem(SEEN_KEY, version);
  } catch {
    // Without storage there is nothing to remember; lastSeen() keeps the popup closed.
  }
}

/**
 * The popup opens on the feed only, for a signed-in person who is not about to be sent to the
 * onboarding, once per published release (`version`). Without storage it never opens, instead of
 * opening on every visit. Seen state lives in localStorage, so another device shows it once more.
 */
export function shouldShowWhatsNew(
  pathname: string,
  user: Pick<AuthUser, "onboardingCompleted"> | null | undefined,
  version: string | null | undefined,
): boolean {
  if (pathname !== "/feed" || !user || user.onboardingCompleted === false || !version) return false;
  const seen = lastSeen();
  return seen !== undefined && seen !== version;
}
