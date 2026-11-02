import type { RecentEmote } from "@/types/components/emotes/recent-emote";

/**
 * Stickers this person picked last, newest first, kept on this device only (issue #555).
 *
 * The thumbnail is stored WITH the code: the tab has to draw the sticker the person just used even
 * when the catalog index is empty or still loading. Resolving the code against the index made the
 * tab disappear (or sit on "Carregando figurinhas...") whenever the index had nothing to say.
 */
const KEY = "rede:emotes:recent:v1";

/** Three rows of the widest grid (8 columns). */
export const RECENT_EMOTES_LIMIT = 24;

/** Same shape the index cache accepts: no whitespace, brackets or backticks. */
const CODE = /^[^\s[\]`]{1,64}$/u;
/** Only our proxy: a stored entry never becomes an image from somewhere else. */
const THUMB = /^\/emotes\/image\/[A-Za-z0-9]+\/[A-Za-z0-9_-]+\?[A-Za-z0-9=&_.-]*$/;

function toEntry(value: unknown): RecentEmote | null {
  // The first version of this list stored bare codes; those still load, just without a thumbnail.
  if (typeof value === "string") return CODE.test(value) ? { code: value, thumb: null } : null;
  if (!value || typeof value !== "object") return null;
  const { code, thumb } = value as { code?: unknown; thumb?: unknown };
  if (typeof code !== "string" || !CODE.test(code)) return null;
  if (typeof thumb !== "string" || !THUMB.test(thumb)) return { code, thumb: null };
  return { code, thumb };
}

export function loadRecentEmotes(): RecentEmote[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value) => toEntry(value) ?? []).slice(0, RECENT_EMOTES_LIMIT);
  } catch {
    return [];
  }
}

/** Moves `item` to the front and returns the new list. */
export function rememberRecentEmote(item: RecentEmote): RecentEmote[] {
  const next = [item, ...loadRecentEmotes().filter((saved) => saved.code !== item.code)].slice(
    0,
    RECENT_EMOTES_LIMIT,
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode): recents just don't persist on this device.
  }
  return next;
}
