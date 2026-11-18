// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Notification } from "@/types/application/notification/notification";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotificationsPanel } from "./use-notifications-panel";

const mocks = vi.hoisted(() => ({
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  firstPage: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  notificationsApi: {
    markAsRead: mocks.markAsRead,
    markAllAsRead: mocks.markAllAsRead,
  },
  networkApi: {},
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => () => {} }));
vi.mock("@/lib/use-personalization", () => ({
  useDisabledModules: () => new Set(),
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KEY = ["notifications", "page", "SOCIAL"];

function notification(id: string, read = false): Notification {
  return {
    id,
    kind: "NEW_REACTION",
    actorId: null,
    actorName: null,
    actorUsername: null,
    actorAvatar: null,
    title: "Aviso",
    body: "Aviso de teste",
    createdAt: "2024-01-01T12:00:00Z",
    read,
    href: "/feed",
    ctaLabel: "Ver",
  };
}

const panel: { current: ReturnType<typeof useNotificationsPanel> | null } = { current: null };

function Probe() {
  panel.current = useNotificationsPanel([], { requestsEnabled: false });
  return null;
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("rollback de leitura dos avisos", () => {
  let root: Root;
  let client: QueryClient;
  let host: HTMLDivElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first = { items: [notification("first")], nextCursor: "older" };
    client.setQueryData(KEY, {
      pages: [
        first,
        { items: [notification("older"), notification("already", true)], nextCursor: null },
      ],
      pageParams: [null, "older"],
    });
    const query = client.getQueryCache().find({ queryKey: KEY })!;
    (query.options as { initialPageParam?: unknown }).initialPageParam = null;
    mocks.firstPage.mockResolvedValue(first);
    query.options.queryFn = mocks.firstPage;
    vi.spyOn(query, "getObserversCount").mockReturnValue(1);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
    panel.current = null;
    vi.restoreAllMocks();
  });

  it.each(["one", "all"] as const)(
    "restaura a segunda página quando o servidor recusa a leitura: %s",
    async (mode) => {
      let reject!: (error: Error) => void;
      const pending = new Promise<void>((_resolve, fail) => {
        reject = fail;
      });
      mocks.markAsRead.mockReturnValue(pending);
      mocks.markAllAsRead.mockReturnValue(pending);

      act(() => {
        if (mode === "one") panel.current!.onMarkAsRead("older");
        else panel.current!.onMarkAllRead();
      });
      await flush();

      expect(client.getQueryData(KEY)).toMatchObject({
        pages: [
          expect.anything(),
          {
            items: [
              { id: "older", read: true },
              { id: "already", read: true },
            ],
          },
        ],
      });

      await act(async () => reject(new Error("offline")));
      await flush();

      expect(client.getQueryData(KEY)).toMatchObject({
        pages: [
          expect.anything(),
          {
            items: [
              { id: "older", read: false },
              { id: "already", read: true },
            ],
            nextCursor: null,
          },
        ],
        pageParams: [null, "older"],
      });
      expect(mocks.firstPage).toHaveBeenCalledTimes(1);
      expect(mocks.toast).toHaveBeenCalledExactlyOnceWith(texts.errors.unexpected, "error");
    },
  );
});
