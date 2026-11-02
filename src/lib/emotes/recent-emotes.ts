/**
 * Stickers this person picked last, newest first, kept on this device only (issue #555).
 *
 * Only codes are stored: the image comes from the live index, so a code that left the catalog
 * simply stops showing up instead of rendering a dead image.
 */
const KEY = "rede:emotes:recent:v1";

/** Three rows of the widest grid (8 columns). */
export const RECENT_EMOTES_LIMIT = 24;

/** Same shape the index cache accepts: no whitespace, brackets or backticks. */
const CODE = /^[^\s[\]`]{1,64}$/u;

export function loadRecentEmotes(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((code): code is string => typeof code === "string" && CODE.test(code))
      .slice(0, RECENT_EMOTES_LIMIT);
  } catch {
    return [];
  }
}

/** Moves `code` to the front and returns the new list. */
export function rememberRecentEmote(code: string): string[] {
  const next = [code, ...loadRecentEmotes().filter((c) => c !== code)].slice(
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
