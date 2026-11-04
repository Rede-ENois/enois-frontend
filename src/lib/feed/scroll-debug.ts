import type { ScrollDebugEntry } from "@/types/lib/feed/scroll-debug-entry";

const SESSION_KEY = "enois-feed-scroll-debug";
/** Enough for a minute of scrolling; older lines drop off. */
const MAX_ENTRIES = 800;

const entries: ScrollDebugEntry[] = [];

/**
 * Feed scroll probe for people who see the feed jump: `/feed?debug=scroll` turns it on for the
 * browser session (the router may drop the query on the next navigation, so it is kept). Off by
 * default and for everyone else: nothing is recorded or rendered.
 */
export function scrollDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("debug") === "scroll") {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      return true;
    }
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function recordScrollDebug(entry: ScrollDebugEntry): void {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

/** Plain text to paste in a chat: the device first, then one entry per line. No personal data. */
export function scrollDebugReport(): string {
  const device = `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}`;
  return [device, ...entries.map((entry) => JSON.stringify(entry))].join("\n");
}

export function clearScrollDebug(): void {
  entries.length = 0;
}
