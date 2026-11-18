import { useLayoutEffect, useRef, useState } from "react";

const MAX_REPLY_PAGES = 10;
const REPLY_NAVIGATION_TIMEOUT_MS = 15_000;

async function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
  });
  try {
    return await Promise.race([promise, cancelled]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

function findReplyTarget(scroller: HTMLDivElement, messageId: string) {
  // O dock e a rota podem exibir a mesma conversa: ids globais não identificam a thread clicada.
  return Array.from(scroller.querySelectorAll<HTMLElement>("[id]")).find(
    (element) => element.id === `message-${messageId}`,
  );
}

function waitForReplyTarget(
  scroller: HTMLDivElement,
  messageId: string,
  signal: AbortSignal,
): Promise<HTMLElement> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      observer.disconnect();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(signal.reason);
    };
    const observer = new MutationObserver(() => {
      const target = findReplyTarget(scroller, messageId);
      if (!target) return;
      cleanup();
      resolve(target);
    });
    signal.addEventListener("abort", abort, { once: true });
    observer.observe(scroller, { childList: true, subtree: true });
  });
}

function focusReply(scroller: HTMLDivElement, target: HTMLElement) {
  const targetBounds = target.getBoundingClientRect();
  const top =
    scroller.scrollTop +
    targetBounds.top -
    scroller.getBoundingClientRect().top -
    (scroller.clientHeight - targetBounds.height) / 2;
  scroller.scrollTo({ top, behavior: "smooth" });
  target.focus({ preventScroll: true });
}

export function useReplyNavigation({
  conversationId,
  enabled,
  loadedMessageIds,
  nextCursor,
  loadOlder,
  notify,
}: {
  conversationId: string;
  enabled: boolean;
  loadedMessageIds: ReadonlySet<string>;
  nextCursor: string | null;
  loadOlder: (
    messageId: string,
    signal: AbortSignal,
  ) => Promise<{ targetLoaded: boolean; nextCursor: string | null }>;
  notify: (status: "loading" | "unavailable" | "error") => void;
}) {
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const [navigating, setNavigating] = useState(false);
  const activeNavigation = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    setNavigating(false);
    return () => {
      activeNavigation.current?.abort();
      activeNavigation.current = null;
    };
  }, [conversationId, enabled]);

  const navigateToReply = async (messageId: string) => {
    const scroller = messagesScrollRef.current;
    if (!enabled || !scroller || activeNavigation.current) return;
    const controller = new AbortController();
    activeNavigation.current = controller;
    const { signal } = controller;
    const timeout = setTimeout(() => controller.abort("timeout"), REPLY_NAVIGATION_TIMEOUT_MS);
    try {
      let target = findReplyTarget(scroller, messageId);
      if (!target) {
        setNavigating(true);
        notify("loading");
        let cursor = nextCursor;
        let targetLoaded = loadedMessageIds.has(messageId);
        let pagesLoaded = 0;
        const visitedCursors = new Set<string>();
        while (!targetLoaded && cursor) {
          if (pagesLoaded >= MAX_REPLY_PAGES) throw new Error("reply-page-limit");
          if (visitedCursors.has(cursor)) throw new Error("reply-repeated-cursor");
          visitedCursors.add(cursor);
          const result = await untilAborted(loadOlder(messageId, signal), signal);
          signal.throwIfAborted();
          pagesLoaded++;
          targetLoaded = result.targetLoaded;
          cursor = result.nextCursor;
        }
        target = findReplyTarget(scroller, messageId);
        if (!target && targetLoaded) target = await waitForReplyTarget(scroller, messageId, signal);
      }
      signal.throwIfAborted();
      if (target) focusReply(scroller, target);
      else notify("unavailable");
    } catch {
      if (!signal.aborted || signal.reason === "timeout") notify("error");
    } finally {
      clearTimeout(timeout);
      if (activeNavigation.current === controller) {
        activeNavigation.current = null;
        setNavigating(false);
      }
    }
  };

  return { messagesScrollRef, navigating, navigateToReply };
}
