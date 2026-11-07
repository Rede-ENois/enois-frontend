import { useCallback, useEffect, useRef, useState } from "react";

import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";
import type { HeldFeedPages } from "@/types/lib/feed/feed-arrivals";
import type { FeedPages } from "@/types/lib/feed/feed-pages";

/**
 * Below this the reader is far enough down that the top of the feed is out of sight: posts that
 * arrived there are announced instead of appearing on their own.
 */
export const NEW_POSTS_NOTICE_SCROLL = 200;

/**
 * Whether the first page, rewritten by a refresh, may be put in front of the reader's list without
 * asking. On "Tudo" and "Comunidade" the first page is the newest posts and only ever grows at the
 * top. On "Para você" the order is the backend's ranking: a refresh reshuffles it, and its first
 * page is not a set of new posts — it is the same feed in another order.
 */
export function adoptsFirstPage(tab: string): boolean {
  return tab === "ALL" || tab === "COMMUNITY" || tab === "CORPORATE";
}

/** How many posts at the top of the page the reader has not seen. */
export function countNewPosts(known: Set<string>, page: PageResponse<PostView>): number {
  let count = 0;
  for (const post of page.items) {
    if (known.has(post.id)) break;
    count++;
  }
  return count;
}

/**
 * Whether the first page that came back has to wait instead of entering the list: it changed, and the
 * reader is scrolled down. Inserted right away it would move every card down while the person reads.
 *
 * An empty list is not a change worth waiting for: it is the first load of a tab or filter. Neither is
 * a changed ranking (`adoptsFirstPage` false): the reader keeps the list they were reading and gets
 * the fresh order when they go back to the top.
 */
export function holdsFirstPage(
  previous: readonly Pick<PostView, "id">[],
  page: PageResponse<PostView>,
  chronological: boolean,
  scrollY: number,
): boolean {
  if (scrollY === 0 || previous.length === 0 || page.items.length === 0) return false;
  const known = new Set(previous.map((post) => post.id));
  if (chronological) return countNewPosts(known, page) > 0;
  return page.items.some((post) => !known.has(post.id)) || page.items[0].id !== previous[0].id;
}

/**
 * The pages the list renders: the first page the reader already had, followed by the pages loaded
 * after it. While a refresh waits, the new first page stays in the query cache — the reader keeps
 * exactly the list they were reading.
 *
 * The pages after the first are the ones the refresh brought, and a post that arrived at the top
 * pushed the others down: the first of them repeats the last posts of the held page. They are dropped
 * here — the list is keyed by post id, and a repeated id would be measured as the same card twice.
 */
export function pagesWithHeldFirst(
  data: FeedPages | undefined,
  held: HeldFeedPages | null,
): PageResponse<PostView>[] {
  if (!data) return [];
  if (held === null || held.pages.length === 0) return data.pages;
  const seen = new Set(held.pages[0].items.map((post) => post.id));
  const rest = data.pages.slice(1).map((page) => {
    const items = page.items.filter((post) => !seen.has(post.id));
    for (const post of items) seen.add(post.id);
    return { ...page, items };
  });
  return [held.pages[0], ...rest];
}

/**
 * Holds the first page that a refresh rewrote while the reader is scrolled down, and lets it in when
 * the reader takes it ("novos posts", which goes back to the top) or when they go back to the top
 * themselves.
 */
export function useFeedArrivals(data: FeedPages | undefined, tab: string, scope: string) {
  const [held, setHeld] = useState<HeldFeedPages | null>(null);
  const [notice, setNotice] = useState(false);
  const lastData = useRef<FeedPages | undefined>(undefined);

  useEffect(() => {
    const previous = lastData.current;
    lastData.current = data;
    if (held !== null || !data || data.pages.length === 0) return;
    const first = data.pages[0];
    const previousPosts = previous?.pages.flatMap((page) => page.items) ?? [];
    const chronological = adoptsFirstPage(tab);
    if (!holdsFirstPage(previousPosts, first, chronological, window.scrollY)) return;
    const known = new Set(previousPosts.map((post) => post.id));
    const count = chronological
      ? countNewPosts(known, first)
      : first.items.filter((post) => !known.has(post.id)).length;
    setHeld({ pages: previous?.pages ?? [first], count });
  }, [data, tab, held]);

  useEffect(() => {
    // Another tab or filter: whatever is held belongs to the one that left.
    setHeld(null);
  }, [scope]);

  const release = useCallback(() => {
    setHeld(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (held === null) return;
    // Back at the top, the posts that arrived are what the reader is going to see anyway.
    const onScroll = () => {
      if (window.scrollY === 0) setHeld(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [held]);

  useEffect(() => {
    // A reordered ranking can wait without a single new post: there is nothing to announce then.
    if (held === null || held.count === 0) {
      setNotice(false);
      return;
    }
    const update = () => setNotice(window.scrollY > NEW_POSTS_NOTICE_SCROLL);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [held]);

  return { pages: pagesWithHeldFirst(data, held), held, notice, release };
}
