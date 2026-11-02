// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleConversationChanged,
  useInboxPollInterval,
  useMessageStream,
} from "./message-stream";

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = FakeEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  private listeners = new Map<string, (event: MessageEvent<string>) => void>();

  constructor(
    readonly url: string,
    readonly init?: EventSourceInit,
  ) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, listener);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(type: string, data: string) {
    this.listeners.get(type)?.({ data } as MessageEvent<string>);
  }
}

function setup() {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  return { queryClient, invalidate };
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let interval: number | false | undefined;

function StreamProbe() {
  useMessageStream();
  interval = useInboxPollInterval(10_000, false);
  return null;
}

function mountStream(queryClient: QueryClient) {
  const container = document.createElement("div");
  root = createRoot(container);
  act(() =>
    root?.render(
      <QueryClientProvider client={queryClient}>
        <StreamProbe />
      </QueryClientProvider>,
    ),
  );
}

describe("message stream", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refetches the changed thread and the inbox", () => {
    const { queryClient, invalidate } = setup();
    handleConversationChanged(queryClient, JSON.stringify({ conversationId: "conv_1" }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["messages", "conv_1"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversations"] });
  });

  it("ignores a malformed signal", () => {
    const { queryClient, invalidate } = setup();
    handleConversationChanged(queryClient, "not json");
    handleConversationChanged(queryClient, JSON.stringify({ conversationId: 42 }));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("stops polling while the stream is live and polls again when it drops", () => {
    mountStream(setup().queryClient);
    const source = FakeEventSource.instances[0];
    expect(source.url).toContain("/conversations/stream");
    expect(source.init?.withCredentials).toBe(true);
    expect(interval).toBe(10_000);

    act(() => source.onopen?.());
    expect(interval).toBe(false);

    act(() => source.onerror?.());
    expect(interval).toBe(10_000);
  });

  it("reconnects after the browser gives up on the stream", () => {
    mountStream(setup().queryClient);
    const first = FakeEventSource.instances[0];

    first.readyState = FakeEventSource.CLOSED;
    act(() => first.onerror?.());
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => vi.advanceTimersByTime(30_000));
    expect(FakeEventSource.instances).toHaveLength(2);

    act(() => root?.unmount());
    root = null;
    expect(FakeEventSource.instances[1].closed).toBe(true);
  });
});
