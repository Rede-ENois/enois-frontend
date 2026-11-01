import { useCallback, useEffect, useRef } from "react";

import type { PostView } from "@/types/application/feed/post-view";
import type { HomeTab } from "@/types/routes/feed/home-tab";

import { feedApi } from "@/lib/api";

const time = (iso: string) => new Date(iso).getTime();

/** Only "Para você" carries the "Você está em dia" marker (the backend sends null on every other tab). */
export function carriesCaughtUp(tab: HomeTab): boolean {
  return tab === "FOR_YOU";
}

/**
 * "Para você" is ordered by relevance, so the divider cannot just sit before the first old post. The
 * posts newer than `lastSeenAt` go first, newest first ("new since your last visit"), then the rest
 * in API order. `caughtUpAt` is the divider index: only when there is a marker, at least one new post
 * above and one old post loaded below; -1 otherwise. The backend pages "Para você" by date window, so
 * a later page never brings a post newer than the loaded old ones and the list only grows at the end.
 */
export function caughtUpOrder<T extends Pick<PostView, "createdAt">>(
  posts: T[],
  lastSeenAt: string | null,
): { posts: T[]; caughtUpAt: number } {
  if (!lastSeenAt) return { posts, caughtUpAt: -1 };
  const seen = time(lastSeenAt);
  const fresh = posts
    .filter((post) => time(post.createdAt) > seen)
    .sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const old = posts.filter((post) => time(post.createdAt) <= seen);
  return {
    posts: [...fresh, ...old],
    caughtUpAt: fresh.length > 0 && old.length > 0 ? fresh.length : -1,
  };
}

/** The newest `createdAt` in the list (the API order of "Para você" is not chronological). */
export function newestCreatedAt(posts: Pick<PostView, "createdAt">[]): string | null {
  return posts.reduce<string | null>(
    (newest, post) =>
      newest === null || time(post.createdAt) > time(newest) ? post.createdAt : newest,
    null,
  );
}

/**
 * Marks the feed as seen ONCE per visit, when the first post leaves through the top of the screen
 * (the person scrolled past it), and only where the marker lives (`enabled`, "Para você"). Returns
 * the ref for the first post's wrapper.
 */
export function useMarkFeedSeen(posts: Pick<PostView, "createdAt">[], enabled: boolean) {
  const sent = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const newest = useRef<string | null>(null);

  useEffect(() => {
    newest.current = enabled ? newestCreatedAt(posts) : null;
  }, [posts, enabled]);

  useEffect(() => () => observer.current?.disconnect(), []);

  return useCallback((element: HTMLElement | null) => {
    observer.current?.disconnect();
    if (!element || sent.current || typeof IntersectionObserver === "undefined") return;
    observer.current = new IntersectionObserver(([entry]) => {
      if (sent.current || entry.isIntersecting || entry.boundingClientRect.bottom > 0) return;
      const seenUntil = newest.current;
      if (!seenUntil) return;
      sent.current = true;
      observer.current?.disconnect();
      // Falhar aqui só adia o marcador para a próxima visita; não há nada para a pessoa fazer.
      feedApi.markSeen(seenUntil).catch(() => undefined);
    });
    observer.current.observe(element);
  }, []);
}
