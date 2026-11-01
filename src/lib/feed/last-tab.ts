import type { HomeTab } from "@/types/routes/feed/home-tab";

const LAST_FEED_TAB_KEY = "connect-grow-last-feed-tab";

/** The tab the feed opens on when nothing was chosen yet (or the saved one is no longer offered). */
export const DEFAULT_FEED_TAB: HomeTab = "ALL";

/**
 * Tabs worth remembering. "CORPORATE" is left out: it is not a choice, the professional interface
 * forces it, and saving it would send the social interface to a tab it does not have.
 */
const REMEMBERABLE_TABS: readonly HomeTab[] = [
  "ALL",
  "FOR_YOU",
  "UNSEEN",
  "TRENDING",
  "INTERACTED",
];

/**
 * The last tab chosen on the feed, kept in the browser (like the last topic of the composer): the
 * feed reopens where the person left it. A missing, unreadable or no longer offered value falls back
 * to "Tudo".
 */
export function readLastFeedTab(): HomeTab {
  if (typeof localStorage === "undefined") return DEFAULT_FEED_TAB;
  try {
    const saved = localStorage.getItem(LAST_FEED_TAB_KEY);
    return REMEMBERABLE_TABS.find((tab) => tab === saved) ?? DEFAULT_FEED_TAB;
  } catch {
    return DEFAULT_FEED_TAB;
  }
}

export function rememberFeedTab(tab: HomeTab): void {
  if (!REMEMBERABLE_TABS.includes(tab)) return;
  try {
    localStorage.setItem(LAST_FEED_TAB_KEY, tab);
  } catch {
    // modo privado/cota: a escolha vale só para esta sessão.
  }
}
