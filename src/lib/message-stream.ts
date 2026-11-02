import { useEffect, useSyncExternalStore } from "react";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { apiUrl } from "./api-client";
import { liteInterval } from "./lite-mode";

/**
 * Inbox in real time: one server-sent events stream per tab says "conversation X changed" and the
 * matching queries refetch. The stream never carries message content (E2E stays end to end): the
 * refetch goes through the usual endpoints.
 *
 * While the stream is down (offline, proxy hiccup, expired session) the inbox falls back to the
 * old polling, so nothing goes stale; once it is back, polling stops.
 */

/** A stream closed for good (401, server restart) is tried again after this long. */
const RETRY_CLOSED_MS = 30_000;

let live = false;
const listeners = new Set<() => void>();

function setLive(next: boolean) {
  if (live === next) return;
  live = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while the stream is connected; the server render never has one. */
export function useMessageStreamLive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => live,
    () => false,
  );
}

/** Polling interval for inbox queries: off while the stream delivers changes. */
export function useInboxPollInterval(baseMs: number, lite: boolean): number | false {
  return useMessageStreamLive() ? false : liteInterval(baseMs, lite);
}

export function handleConversationChanged(queryClient: QueryClient, data: string) {
  let conversationId: unknown;
  try {
    conversationId = (JSON.parse(data) as { conversationId?: unknown }).conversationId;
  } catch {
    return;
  }
  if (typeof conversationId !== "string") return;
  void queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
  // Prefix: inbox, archived, unread counters and the dock all live under "conversations".
  void queryClient.invalidateQueries({ queryKey: ["conversations"] });
}

/** Opens the stream for the signed-in user; mount once, only with a session. */
export function useMessageStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      source = new EventSource(apiUrl("/conversations/stream"), { withCredentials: true });
      source.onopen = () => {
        setLive(true);
        // Whatever changed while disconnected was missed: catch up once.
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      };
      source.addEventListener("conversation", (event) =>
        handleConversationChanged(queryClient, (event as MessageEvent<string>).data),
      );
      source.onerror = () => {
        setLive(false);
        // CONNECTING means the browser is already reconnecting on its own; CLOSED means it gave up.
        if (source?.readyState === EventSource.CLOSED) {
          source.close();
          retry = setTimeout(connect, RETRY_CLOSED_MS);
        }
      };
    };

    connect();
    return () => {
      clearTimeout(retry);
      source?.close();
      setLive(false);
    };
  }, [queryClient]);
}
